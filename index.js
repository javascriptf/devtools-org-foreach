const {Octokit} = require('@octokit/rest');
const fs = require('extra-fs');
const cp = require('extra-child-process');

const ORG   = 'nodef';
const REPOS = [
  'sleep.cmd',
  'extra-iterable',
  'extra-build',
  'extra-function',
  'extra-async-function',
  'extra-bit',
  'extra-integer',
  'extra-boolean',
  'extra-sleep',
  'extra-path',
  'extra-bigint',
  'extra-math',
  'extra-number',
  'extra-bel.sh',
  'extra-markdown-text',
  'extra-jsdoc-text',
  'extra-javascript-text',
  'extra-fyers',
  'cls.sh',
  'clear.cmd',
  'extra-cd',
  'extra-child-process',
  'extra-fs',
  'nvgraph.sh',
  'snap-data.sh',
];




// Perform an operation for each repository in an organization.
async function forEachRepo(options, fn) {
  var o = Object.assign({}, options);
  var octokit = new Octokit({auth: o.auth});
  for (var page=0;; ++page) {
    var repos = await octokit.repos.listForOrg({org: o.org, page});
    if (repos.data.length===0) break;
    for (var r of repos.data)
      fn(r);
  }
}


function addOrgBadge() {
  var org   = ORG;
  var stdio = [0, 1, 2];
  var badge = `https://img.shields.io/badge/org-${org}-green?logo=Org`;
  var url   = `https://${org}.github.io`
  for (var repo of REPOS) {
    console.log(`Processing ${org}/${repo} ...`);
    cp.execSync(`rm -rf tmp && git clone https://github.com/${org}/${repo} tmp`, {stdio});
    var md = fs.readFileTextSync('tmp/README.md');
    if (md.includes('[![ORG]') || !md.includes('[![DOI]')) continue;
    md = md.replace('[![DOI]', `[![ORG](${badge})](${url})\n[![DOI]`);
    fs.writeFileTextSync('tmp/README.md', md);
    cp.execSync(`enpm push "w/ org badge"`, {stdio, cwd: 'tmp'});
  }
}
addOrgBadge();
