const http = require("http");
const { analyzeSequence, patternCatalog } = require("./lib/dragonx");
const server = http.createServer((req,res)=>{
  res.setHeader("Content-Type","application/json");
  if(req.method==="GET" && req.url==="/api/patterns") return res.end(JSON.stringify({count:patternCatalog.length,patterns:patternCatalog}));
  if(req.method==="POST" && req.url==="/api/analyze"){
    let raw="";req.on("data",c=>raw+=c);
    req.on("end",()=>{try{const b=JSON.parse(raw);res.end(JSON.stringify(analyzeSequence(b.sequence,{periods:b.periods,allowedSymbols:b.allowedSymbols})));}catch(e){res.statusCode=400;res.end(JSON.stringify({error:e.message}));}});
    return;
  }
  res.statusCode=404;res.end(JSON.stringify({error:"Not found"}));
});
server.listen(process.env.PORT||3000,()=>console.log("DRAGON-X local server ready on port "+(process.env.PORT||3000)));
