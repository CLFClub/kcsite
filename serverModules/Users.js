const Router=require("koa-router")
const Route=new Router()
const assert=require("assert")
let multer=require("koa-multer")
const session=require("koa-session2")
//为了配合vscode的自动提示
//此处假装require一次
//发布时可以去掉（也可以不去)
let mongoose=require("mongoose");
//
//设置为全局数据库
mongoose=global.SiteDB

Route.use(session({
    key:"koa:Users"
}))
// 配置bodyparser
// 不过它好像只是解析form默认编码格式的数据
//用来处理普通表单
let parser=require("koa-bodyparser")
Route.use(parser())

//此处 type为用户组
//目前暂定 0为总管理员 1为普通管理员 2为普通用户
//img为用户头像的文件名 用户头像全部储存在一个特定目录中
let UserScheme=new mongoose.Schema({
    username:{type:String,index:true,unique:true},
    password:String,
    type:{type:Number,index:true},
    nickname:{type:String,index:true},
    age:{type:Number,index:true},
    description:String,
    img:String,
    other:mongoose.SchemaTypes.Mixed
})
//用户信息collection
let UserModel=mongoose.model("Users",UserScheme)
//这东西似乎可以解析对象也可以解析文件数据
//文件数据为ctx.req.file
//kv数据为ctx.req.body
//有文件时可以用这个 其他时候太麻烦
let upload=multer({
    dest:"./serverModules/Users/file"
})
Route.post("/add",upload.single("file"),async (ctx,next)=>{
    //此三个对象为file对象中的成员 具体成员需要在debug时查看
    const {originalname,path,mimetype}=ctx.req.file;

    ctx.body=originalname;
    ctx.body+=JSON.stringify(ctx.req.body)
})



//登录接口
const LoginState={
    Success:0,
    NoUser:1,
    ErrorPass:2
}
Route.post("/login",async (ctx,next)=>{
    let body=ctx.request.body
    //读取如下字段
    let username=body["username"];
    let password=body["password"];
    //此为在客户端加密的数据的base64文本 服务端进行同样过程后比对结果
    //目前做明文登录 省略此过程
    let sectext=body["sectext"];
    //不能为空
    assert.notEqual(username,null)
    assert.notEqual(password,null)
    // assert.notEqual(sectext,null)
    //
    let userinfo=await UserModel.find({username:username}).exec()
    if(userinfo==null) ctx.body=LoginState.NoUser
    if(userinfo.password!=password) ctx.body=LoginState.ErrorPass;
    //设置session
    ctx.session.loginedUser=username;
    ctx.body=LoginState.Success
})
Route.get("/getlogin",async (ctx,next)=>{
    let uname=ctx.session.loginedUser;
    if(uname==null) ctx.body="尚未登录";
    else ctx.body=`当前登录用户：${uname}`;
})

module.exports=Route;