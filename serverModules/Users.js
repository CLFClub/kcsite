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

//此处 type为用户组
//目前暂定 0为总管理员 1为普通管理员 2为普通用户
let UserScheme=new mongoose.Schema({
    username:{type:String,index:true},
    password:String,
    type:{type:Number,index:true},
    nickname:{type:String,index:true},
    age:{type:Number,index:true},
    description:String,
    other:mongoose.SchemaTypes.Mixed
})
let UserModel=mongoose.model("Users",UserScheme)
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
    //此三个对象为file对象中的成员 具体成员需要在debug时查看
    const {originalname,path,mimetype}=ctx.req.file;

    ctx.body=originalname;
    ctx.body+=JSON.stringify(ctx.req.body)
})
module.exports=Route;