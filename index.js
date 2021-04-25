#!/usr/bin/env node
var r=o=>new Promise(n=>setTimeout(n,o)),t=o=>`Hello ${o}`,e=async()=>(console.log(t("World")),await r(1e3),console.log("done"),!0);e();
