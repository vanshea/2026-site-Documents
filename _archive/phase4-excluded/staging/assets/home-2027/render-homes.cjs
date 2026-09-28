// Refresh the selected Build homepage and its aliases without changing other pages.
const {execFileSync}=require("node:child_process");
const path=require("node:path");
execFileSync("python3",[path.join(__dirname,"apply-site-theme.py"),"--home-only"],{stdio:"inherit"});
