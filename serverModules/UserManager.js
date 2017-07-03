const Router=require("koa-router")
const Route=new Router()
const assert=require("assert")
const mongoose=require("mongoose")
mongoose.Promise=Promise;

mongoose.connect("mongodb://localhost/test",{},(err)=>{
        console.log(err)
    })
let TestModel=mongoose.model("TestModel",{
    name:String,
    password:String
})

Route.all("/",async (ctx,next)=>{
    ctx.body="hello world";
    
})
Route.all("/add")
module.exports=Route;