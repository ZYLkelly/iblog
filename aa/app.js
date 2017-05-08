var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var router = require('./routes/index');
// var users = require('./routes/users');
//引入数据库配置信息
var settings=require('./setting');
//引入flash模块
var flash=require('connect-flash');
//支持会话
var session=require('express-session');
//讲会话保存在mongodb当中去
var MongoStore=require('connect-mongo')(session);

var db = require('./models/db');
var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
require('events').EventEmitter.defaultMaxListeners = Infinity;
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());
app.use(session({
    //防止篡改cookie
    secret:settings.cookieSecret,
    //设置值
    key:settings.db,
    //cookie的生存周期
    cookie:{maxAge:1000*60*60*24*30},
    //将session的信息存储到数据库当中去
    store:new MongoStore({
        //链接数据库当中的blog数据库
        url:'mongodb://localhost/new'
    }),
    resave:false,
    saveUninitialized:true
}))
router(app)

// app.use('/', index);
// app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
app.listen(3006,function () {
  console.log('node is ok')

})
module.exports = app;

