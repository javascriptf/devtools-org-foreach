const {Octokit} = require('@octokit/rest');
const fs = require('extra-fs');
const cp = require('extra-child-process');

const E = process.env;
const stdio = [0, 1, 2];
const org   = 'ifct2017';
const REPOS = [];




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


function updateGitignore() {
  var options = {auth: E.GITHUB_TOKEN, org};
  forEachRepo(options, repo => {
    console.log(`\nProcessing ${org}/${repo.name}`);
    cp.execSync(`rm -rf tmp && git clone https://github.com/${org}/${repo.name} tmp`, {stdio});
    var txt = fs.readFileTextSync(`tmp/README.md`);
    if (!txt.includes('[![ORG]')) return;
    var txt = fs.readFileTextSync(`tmp/.gitignore`);
    if (!txt.includes('*.d.ts')) return;
    txt = txt.replace('*.d.ts\n', '');
    fs.writeFileTextSync(`tmp/.gitignore`, txt);
    cp.execSync(`egit apush`, {stdio, cwd: 'tmp'});
  })
}
updateGitignore();
