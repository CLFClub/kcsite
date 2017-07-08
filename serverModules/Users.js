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

//此处 Admin为管理 如学院领导等
// Master为系统管理员 比如技术人员 Master只能由内部录入用户
//Admin可以操作Student 和Techer用户
//Admin可以由Master添加
//Normal为非本校人员 拥有最低权限
const UserType={
    Master:0,
    Admin:1,
    Techer:2,
    Student:3,
    Normal:4
}
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
    email:String,
    pnumber:String,
    img:String,
    orginzation:[],
    other:mongoose.SchemaTypes.Mixed
})
//用户信息collection
let UserModel=mongoose.model("Users",UserScheme)







//密码解码
async function GetPassword(base64text)
{
    return base64text;
}
//密码格式检测
async function CheckPassword(pas)
{
    return true;
}

//以下为用户资料相关

//以下为总工具函数
//获得某个用户的完整信息对象 包括密码
async function GetUserInfo(uname)
{
    assert.notEqual(uname,null)
    let res=await (UserModel.findOne({username:uname}).exec())
    if(res==null) return null;
    let obj=res.toObject()
    return obj
}
//设置一个用户的资料（不包括密码）
//如果要强制设置密码 设置forcePass为true
//注意这个函数可以更改用户名
async function SetUserInfo(uname,nobj,forcePass)
{
    assert.notEqual(uname,null)
    let res=await (UserModel.findOne({username:uname}).exec())
    if(res==null) return;
    // let obj=res.toObject()
    for(let item in nobj){
        if(item in res&&item!="password"){
            res[item]=nobj[item];
        }
    }
    //强制更新密码
    if(forcePass==true)  res["password"]=obj["password"];
    res.save()
}
//添加一个用户
async function AddUser(infoobj)
{
    let req=[
        "username",
        "password",
        "nickname",
        "type"
    ]
    for(let a of req){
        if(!(a in infoobj)) return false;
    }
    //如果已经有了就返回false
    if(await UserModel.findOne({username:infoobj["username"]})) return false;
    let nobj=new UserModel(infoboj);
    nobj.save()
    return true;
}
//删除一个用户
async function RemoveUser(uname)
{
    UserModel.remove({username:uname});
}


//以下为用户自己使用的工具函数
/**
 * 用旧密码设置新密码
 * @param {String} uname 
 * @param {String} opass 
 * @param {String} npass 
 * @return {Boolean} 是否重置成功
 */
async function SetUserPassword(uname,opass,npass)
{
    assert.notEqual(uname,null)
    let res=await (UserModel.findOne({username:uname}).exec())
    if(res==null) return;
    if(res.password==opass){
        res.password=npass;
        res.save()
        return true;
    }
    else return false;
}

//以下为第三方操作函数
//以下为显示信息过滤函数
//根据用户type进行个人信息过滤
//信息读取过滤
//此过滤器用于对第三方过滤个人资料
async function ReadFilter(obj,utype)
{
    let BanType={};
    BanType[UserType.Master]=new Set()
    BanType[UserType.Admin]=new Set(["password"])
    BanType[UserType.Techer]=new Set(["password"])
    BanType[UserType.Student]=new Set(["password","email","pnumber"])
    BanType[UserType.Normal]=new Set(["password","email","pnumber"])
    //以上为每个用户类型的禁止列表
    let bant=BanType[utype];
    assert.notEqual(bant,null)
    let ret={};
    for(let item in obj){
        if(!bant.has(item)){
            ret[item]=obj[item]
        }
    }
    return ret;
}
//写入权限过滤
//用于对第三方对个人资料写入进行过滤
//由outype级别的用户对wutype级别的用户进行操作
async function WriteFilter(obj,outype,wutype)
{
    //同级别或更低级别的用户不能对高级别用户进行任何操作
    //使得老师与学生的第三方写入权限相同
    //master拥有完全控制权
    if(outype==UserType.Master) return obj;
    if(outype==UserType.Techer) outype=UserType.Student;
    if(outype>=wutype) return null;
    //第三方写入不允许写入密码和用户名
    let ret=JSON.parse(JSON.stringify(obj))
    ret["password"]=undefined;
    ret["username"]=undefined;
    //防止提权 新type不能高于写入者自己的type
    if(ret["type"]<outype) return null;
    return ret;
}

















//webapi区域
//登录接口
const LoginState={
    Success:0,
    NoUser:1,
    ErrorPass:2,
    Error:3
}
Route.post("/login",async (ctx,next)=>{
    let body=ctx.request.body
    //读取如下字段
    let username=body["username"];
    let password=body["password"];
    //不能为空
    if(username==null||password==null){ctx.body=LoginState.Error;return;}
    password=GetPassword(password);//密码解码
    //
    let userinfo=await UserModel.findOne({username:username}).exec()
    if(userinfo==null) ctx.body=LoginState.NoUser
    if(userinfo.password!=password) ctx.body=LoginState.ErrorPass;
    //设置session
    ctx.session.loginedUser=username;
    ctx.body=LoginState.Success
})
//获得当前登录的用户 若未登录则返回 null 
//全部以json方式返回
Route.get("/getlogin",async (ctx,next)=>{
    let uname=ctx.session.loginedUser;
    if(uname==null) ctx.body=JSON.stringify(null);
    else ctx.body=JSON.stringify(uname);
})
//登出
Route.get("/logout",async (ctx,next)=>{
    let uname=ctx.session.loginedUser;
    if(uname==null) return;
    ctx.session.loginedUser=null;
})
//获取当前登录用户的相关资料
//自己获取自己的资料 不包括密码
Route.get("/getInfo",async (ctx,next)=>{
    let uname=ctx.session.loginedUser;
    if(uname==null) ctx.body=JSON.stringify(null);
    else{
        let info=await GetUserInfo(uname);
        info["password"]=undefined;
        ctx.body=JSON.stringify(info);
    }
})
//设置当前登录的用户信息
//此接口不能设置密码 用户类型 用户名
Route.post("/setInfo",async (ctx,next)=>{
    let uname=ctx.session.loginedUser;
    if(uname==null) ctx.body=JSON.stringify(false);
    else{
        //设置 从request的body里 即bodyparser解析出的对象里更新
        let obj=ctx.request.body;
        //自己设置自己的信息 不包括用户type和密码
        obj["type"]=undefined;
        obj["password"]=undefined;
        obj["username"]=undefined;
        SetUserInfo(uname,obj);
        return true;
    }
})
//重置密码
Route.post("/resetPass",async (ctx,next)=>{
    let luname=ctx.session.loginedUser;
    let res=await UserModel.findOne({username:luname}).exec()
    let body=ctx.request.body;
    let now=body.nowPass;
    let newp=body.newPass;
    if(now==null||newp==null) {ctx.body=false;return;}
    let npas=GetPassword(now);
    let newpas=GetPassword(nowp);
    ctx.body=await SetUserPassword(luname,npas,newpas)
})
//上传头像 返回头像文件名
let upload=multer({
    dest:"./static/UserImg"
})
Route.post("/uploadImg",upload.single("file"),async (ctx,next)=>{
    //此三个对象为file对象中的成员 具体成员需要在debug时查看
    const {originalname,path,mimetype}=ctx.req.file;

    ctx.body=originalname;
    ctx.body+=JSON.stringify(ctx.req.body)
})
//获得某个特定用户的资料 根据当前登录用户级别过滤
Route.get("/getUserInfo",async (ctx,next)=>{
    let uname=ctx.request.query["username"]
    let luname=ctx.session.loginedUser;
    if(luname==null) {ctx.body=JSON.stringify(null);return;}
    if(uname==null) ctx.body=JSON.stringify(null);
    else{
        let res=await UserModel.findOne({username:luname}).exec()
        let utype=res["type"]
        ctx.body=await ReadFilter(await GetUserInfo(uname),utype)
        // ctx.body=JSON.stringify(ctx.body)
    }
})
//设置某个特定用户的资料 根据用户级别控制
//不能更改密码和用户名
Route.post("/setUserInfo",async (ctx,next)=>{
    let body=ctx.request.body;
    let uname=body.username;
    if(uname==null) {ctx.body=false;return;}
    let wres=await UserModel.findOne({username:uname}).exec()
    let nowuser=ctx.session.loginedUser;
    if(nowuser==null) {ctx.body=false;return;}
    let nres=await UserModel.findOne({username:nowuser}).exec()
    //如果有密码就先解码
    if(body.password!=null)body=password=GetPassword(body.password);
    //使用Write过滤器过滤系将写入的对象
    //按用户权限过滤
    let nobj=WriteFilter(body,nres.type,wres.type)
    //注意下面这个函数是个全功能函数，除了自带的针对密码的策略外
    //可以修改任何内容
    SetUserInfo(uname,nobj);
})
//Admin特权接口
Route.post("/addUser",async (ctx,next)=>{
    let luname=ctx.session.loginedUser;
    if(luname==null) {ctx.body=false;return;}
    let res=await GetUserInfo(luname)
    if(res.type<=UserType.Admin){
        //添加用户
        let body=ctx.request.body;
        if(body==null||body.password==null){ctx.body=false;return;}
        //密码解码
        body.password=await GetPassword(body.password)
        AddUser(body)
        ctx.body=true
        return;
    }
    ctx.body=false;
});
//Master特权接口
Route.post("/setUserPass",async (ctx,next)=>{
    let luname=ctx.session.loginedUser;
    if(luname==null) {ctx.body=false;return;}
    let res=await UserModel.findOne({username:luname}).exec()
    if(res.type==UserType.Master){
        let body=ctx.request.body;
        //body:{username:xx,password:xx}
        let un=body.username;
        let ps=GetPassword(body.password);
        if(un==null&&ps==null) {ctx.body=false;return;}
        let wres=await UserModel.findOne({username:un}).exec()
        wres.password=ps;
        wres.save()
        ctx.body=true
        return;
    }
    ctx.body=false;
})
//公开接口
global.Users={
    AddUser,
    SetUserPassword,
    SetUserInfo,
    GetUserInfo,
    RemoveUser
}
//
module.exports={
    Route:Route,
    Init(){
        //此处写初始化函数 初始化函数调用时机在所有模块Require后
        //这里可以获得其他模块公开的接口
    }
}