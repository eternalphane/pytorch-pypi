const { createHash } = require('crypto');
const { Octokit } = require('@octokit/rest')
const { parsePkgs, makePages } = require('./util.js');

exports.main = async () => {
    const pkgs = await parsePkgs();
    const message = createHash('sha256').update(JSON.stringify(pkgs)).digest('hex');
    const pages = makePages(pkgs);
    const octokit = new Octokit({
        auth: process.env.AUTH,
        userAgent: 'pytorch-pypi v1.0.0'
    });
    const owner = 'eternalphane';
    const repo = 'pytorch-pypi';
    const ref = 'heads/pypi';
    const commit_sha = (await octokit.git.getRef({ owner, repo, ref })).data.object.sha;
    const { message: msg, tree: { sha: base_tree } } = (await octokit.git.getCommit({
        owner, repo, commit_sha
    })).data;
    if (message === msg) {
        return console.log('Nothing changed');
    }
    const tree = (await octokit.git.createTree({
        // @ts-ignore
        owner, repo, base_tree, tree: await Promise.all(pages.map(async ([path, content]) => ({
            path: `${path}index.html`,
            mode: '100644',
            type: 'blob',
            sha: (await octokit.git.createBlob({ owner, repo, content })).data.sha
        })))
    })).data.sha;
    const sha = (await octokit.git.createCommit({
        owner, repo, message, tree, parents: [commit_sha]
    })).data.sha;
    console.log(await octokit.git.updateRef({ owner, repo, ref, sha }));
};
