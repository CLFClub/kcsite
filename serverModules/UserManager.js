const Router=require("koa-router")
const Route=new Router()
const assert=require("assert")
//为了配合vscode的自动提示
//此处假装require一次
//发布时可以去掉（也可以不去)
let mongoose=require("mongoose");
//
//设置为全局数据库
mongoose=global.SiteDB


//配置bodyparser
//不过它好像只是解析form默认编码格式的数据
// let parser=require("koa-bodyparser")
// Route.use(parser())

let TestModel=mongoose.model("TestModel",{
    name:String,
    password:String
})
Route.all("/getinfo",async (ctx,next)=>{
    ctx.body=await TestModel.find().exec()
})
//这东西似乎可以解析对象也可以解析文件数据
//文件数据为ctx.req.file
//kv数据为ctx.req.body
let multer=require("koa-multer")
let upload=multer({
    dest:"./serverModules/UserManager/file"
})
Route.post("/add",upload.single("file"),async (ctx,next)=>{
    const {originalname,path,mimetype}=ctx.req.file;

    ctx.body=originalname;
    ctx.body+=JSON.stringify(ctx.req.body)
})
module.exports=Route;