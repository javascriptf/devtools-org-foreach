const {Octokit} = require('@octokit/rest');
const fs = require('extra-fs');
const cp = require('extra-child-process');

const E = process.env;
const stdio = [0, 1, 2];
const org   = 'puzzlef';
const REPOS = [];




// Perform an operation for each repository in an organization.
async function forEachRepo(options, fn) {
  var o = Object.assign({}, options);
  var octokit = new Octokit({auth: o.auth});
  var repos   = new Map();
  for (var page=0;; ++page) {
    var pageRepos = await octokit.repos.listForOrg({org: o.org, page, per_page: 100});
    if (pageRepos.data.length===0) break;
    for (var r of pageRepos.data)
      repos.set(r.name, r);
  }
  for (var r of repos.values())
    fn(r);
}


function addOrgBadge() {
  var badge   = `https://img.shields.io/badge/org-${org}-green?logo=Org`;
  var url     = `https://${org}.github.io`
  var options = {auth: E.GITHUB_TOKEN, org};
  forEachRepo(options, repo => {
    console.log(`\nProcessing ${org}/${repo.name} ...`);
    cp.execSync(`rm -rf tmp && git clone https://github.com/${org}/${repo.name} tmp`, {stdio});
    var md = fs.readFileTextSync('tmp/README.md');
    if (md.includes('[![ORG]') || !md.includes('[![DOI]')) return;
    md = md.replace('[![DOI]', `[![ORG](${badge})](${url})\n[![DOI]`);
    fs.writeFileTextSync('tmp/README.md', md);
    cp.execSync(`enpm push "w/ org badge"`, {stdio, cwd: 'tmp'});
  });
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
addOrgBadge();
