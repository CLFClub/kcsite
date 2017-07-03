const Router=require("koa-router")
const Route=new Router()
Route.all("/test",async (ctx,next)=>{
    ctx.body="hello world";
})

module.exports=Route;