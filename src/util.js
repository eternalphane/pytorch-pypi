const fetch = require('node-fetch').default;

const baseUrl = 'https://download.pytorch.org/whl';
const dists = ['torch', 'torchaudio', 'torchvision'];
const re_anchor = /<a[^<]+<\/a>/g;
const re_link = /<a href="(?<href>.+?)">(?<text>.+?)<\/a>/;
const re_dist = new RegExp(String.raw`\b(?:${dists.join('|')})(?=-)`);
const ver = String.raw`(?:\d+!)?\d+(?:\.\d+)*(?:(?:a|b|rc)\d+)?(?:\.post\d+)?(?:\.pre\d+)?`;

exports.parsePkgs = async () => (await (await fetch(`${baseUrl}/torch_stable.html`)).text())
    .match(re_anchor).reduce((pkgs, anchor) => {
        const { href, text } = anchor.match(re_link).groups;
        const [name, tag] = decodeURIComponent(text.indexOf('_cuda80') + 1 ?
            `cu80/${text.replace('_cuda80', '')}` :
            text).split('/').reverse();
        if (re_dist.test(name)) {
            const dist = name.split('-')[0];
            pkgs[dists.indexOf(dist)].pkgs.push([
                tag ? name.replace(new RegExp(`(${dist}-${ver})(\\+${tag})?`), `$1+${tag}`) : name,
                href
            ]);
        }
        return pkgs;
    }, dists.map(d => ({ name: d, pkgs: [] }))).map(({ name, pkgs }) => ({ name, pkgs: pkgs.sort() }));

/**
 * @param {{name: string, pkgs: [string, string][]}[]} pkgs
 * @returns {[string, string][]}
 */
exports.makePages = pkgs => {
    const time = new Date().toISOString().slice(0, 16).replace('T', ' ');
    return pkgs.reduce((pages, { name, pkgs }) => {
        return pages.push([`${name}/`, `<html>
<head><title>${name} - ${time} UTC</title></head>
<body>${pkgs.map(([text, href]) => `<a href="${baseUrl}/${href}">${text}</a>`).join('<br>\n')}</body>
</html>`]), pages;
    }, [['', `<html>
<head><title>Simple index - ${time} UTC</title></head>
<body>${pkgs.map(({ name }) => `<a href="${name}/">${name}</a>`).join('\n')}</body>
</html>`]]);
};
