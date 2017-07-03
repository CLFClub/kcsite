const Koa=require("koa")
// const mount=require("koa-mount")
//全部用router中间件实现
const Router=require("koa-router")
const createStatic=require("koa-static")
const app=new Koa()


const path=require("path")

//顶层路由
const top=new Router()


//静态文件
top.all("/",createStatic(path.join(__dirname,"./static")))


//配置api路由
const apiRouter=new Router()


//用户模块
const UserManager=require("./serverModules/UserManager.js")
apiRouter.use("/user",UserManager.routes(),UserManager.allowedMethods())
//...

//添加api路由
top.use("/api",apiRouter.routes(),apiRouter.allowedMethods())


//使用顶层路由
app.use(top.routes()).use(top.allowedMethods());
app.listen(3000)