# 用户模块
post /login
get /getlogin
get /logout
get /getInfo
post /setInfo
post /resetPass
post /uploadImg //暂不可用
get /getUserInfo
post /addUser //admin特权 必须参数:username password nickname type
post /setUserPass //master特权