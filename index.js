const Koa=require("koa")
// const mount=require("koa-mount")
//全部用router中间件实现
const Router=require("koa-router")
const createStatic=require("koa-static")
//数据库配置
let mongoose=require("mongoose")
mongoose.connect("mongodb://localhost/test")
//设置为默认Promise
mongoose.Promise=Promise
global.SiteDB=mongoose

//以下进行接口配置
const app=new Koa()

const path=require("path")

//顶层路由
const top=new Router()


//静态文件
top.all("/",createStatic(path.join(__dirname,"./static")))


//配置api路由
const apiRouter=new Router()


//加载所有模块
const assert=require("assert")
const ModuleList=require("./ModuleList")
let InitList=[]
for(let item of ModuleList){
    const mod=require(`./serverModules/${item.mod}.js`)
    assert.notEqual(mod.Route,null)
    apiRouter.use(item.url,mod.Route.routes(),mod.Route.allowedMethods())
    //如果有初始化函数就执行初始化
    if(mod.Init) InitList.push(mod.Init);
}
//执行初始化
for(let fun of InitList){
    fun();
}

//添加api路由
top.use("/api",apiRouter.routes(),apiRouter.allowedMethods())


//使用顶层路由
app.use(top.routes()).use(top.allowedMethods());
app.listen(3000)