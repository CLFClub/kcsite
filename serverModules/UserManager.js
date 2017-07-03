const Router=require("koa-router")
const Route=new Router()
const assert=require("assert")
const mongoose=require("mongoose")
mongoose.Promise=Promise;
Route.all("/",async (ctx,next)=>{
    ctx.body="hello world";

    mongoose.connect("mongodb://192.168.1.170/test",{},(err)=>{
        console.log(err)
    })
let TestModel=mongoose.model("TestModel",{
    name:String,
    password:String
})
let me=new TestModel({name:"gaozijian",password:"testpass"})
me.name="高子建";
me.set("password","testtest")
me.save((err)=>{console.log(err)});
mongoose.disconnect();
})


module.exports=Route;