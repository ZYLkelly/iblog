var mongo=require("../models/db");
var multer=require("multer");
var crypto=require("crypto");
var storage=multer.diskStorage({
    destination:function (req,file,cb) {
        cb(null,'./public/images')
    },
    filename:function (req,file,cb) {
        cb(null,file.originalname)
    }
});
var upload=multer({
    storage:storage
})

var User=require("../models/user");
var Post=require("../models/post");
var Comment=require("../models/comment");
/* GET home page. */
function checklogin(req,res,next) {
    if(!req.session.user){
        req.flash("error","未登录");
        res.redirect("login");
    }
    next();
}
function checknotlogin(req,res,next) {
    if(req.session.user){
        req.flash("error","已登录");
        res.redirect('back')
    }
    next();
}

module.exports = function (app) {
    //首页

    app.get('/', function(req, res) {
        var page=parseInt(req.query.p) || 1;
        Post.getTen(null,page,function (err,posts,total) {
            if(err){
                posts=[];
            }
            return res.render('index', {
                title: '首页',
                user:req.session.user,
                success:req.flash("success").toString(),
                error:req.flash("error").toString(),
                posts:posts,
                page:page,
                isFirstPage:(page-1)==0,
                isLastPage:((page-1)*3+posts.length)==total,


            });
        })
    });
    //注册
    app.get('/reg',checknotlogin);
    app.get('/reg',function (req,res) {
      res.render('reg',{
        title:"注册",
        user:req.session.user,
        success:req.flash('success').toString(),
        error:req.flash('error').toString()
      })

    })
    app.post('/reg',checknotlogin);
    app.post('/reg',function (req,res) {
        var name=req.body.name;
        var password=req.body.password;
        var password_re=req.body['password_re'];
        if(password!=password_re){
            req.flash('error','两次输入的密码不一致');
            return res.redirect("/reg");
        }
        var md5=crypto.createHash("md5");
        var password=md5.update(req.body.password).digest("hex");
        var newUser=new User({
            name:name,
            password:password,
            email:req.body.email
        })
        User.get(newUser.name,function (err,user) {
            if(err){
                req.flash('error',err);
                return res.redirect("/");
            }
            if(user){
                req.flash("error","用户名已经存在");
                return res.redirect('/reg');
            }
            newUser.save(function (err,user) {
                if(err){
                    req.flash('error',err);
                    return res.redirect('/reg');
                }
                req.session.user=newUser;
                req.flash("success","注册成功");
                res.redirect('/');
            })
        })

    })
    app.get('/login',checknotlogin);
    app.get('/login',function (req,res) {
      res.render('login',{
          title:'登录',
          user:req.session.user,
          success:req.flash('success').toString(),
          error:req.flash('error').toString()

      })

    })
    app.post('/login',checknotlogin)
    app.post('/login',function (req,res) {
        var md5=crypto.createHash('md5');
        var password=md5.update(req.body.password).digest('hex');
        User.get(req.body.name,function (err,user) {
            if(!user){
                req.flash("error","用户名不存在");
                return res.redirect('/login');
            }
            if(user.password!=password){
                req.flash('error','密码错误');
                return res.redirect('/login');
            }
            req.session.user=user;
            req.flash("success","登录成功");
            res.redirect('/');
        })
    })
    //发表
    app.get('/post',checklogin)
    app.get('/post',function (req,res) {
      res.render('post',{
          title:'发表',
          user:req.session.user,
          success:req.flash('success').toString(),
          error:req.flash('error').toString()
      })

    })
    app.post('/post',checklogin)
    app.post('/post',function (req,res) {
        var currentUser=req.session.user;
        var tags=[req.body.tag1,req.body.tag2,req.body.tag3];
        var post=new Post(currentUser.name,req.body.title,tags,req.body.post);
        post.save(function (err) {
            if(err){
                req.flash("error",err);
                return res.redirect('/');
            }
            req.flash("success","发布成功");
            res.redirect('/');
        })
    })
    //登出
    app.get('/logout',checklogin)
    app.get('/logout',function (req,res) {
        req.session.user=null;
        req.flash("success","登出成功");
        res.redirect('/')
    })
    //上传的页面
    app.get('/upload',checklogin);
    app.get('/upload',function (req,res) {
        res.render('upload',{
            title:'文件上传',
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        })
    })
    app.post('/upload',checklogin);
    app.post('/upload',upload.array('field1',5),function (req,res) {
        req.flash('success','文件上传成功');
        res.redirect('/upload');
    })

    //用户页面的路由
    app.get('/u/:name',function (req,res) {
        var page=parseInt(req.query.p) || 1;
        User.get(req.params.name,function (err,user) {
            if(!user){
                req.flash('error','用户不存在');
                return res.redirect('/');
            }
            Post.getTen(user.name,page,function (err,posts,total) {
                if(err){
                    req.flash('error',err);
                    return res.redirect('/');
                }
                res.render('user',{
                    title:user.name,
                    posts:posts,
                    page:page,
                    isFirstPage:(page-1)==0,
                    isLastPage:((page-1)*3+posts.length)==total,

                    user:req.session.user,
                    success:req.flash('success').toString(),
                    error:req.flash('error').toString()
                })
            })
        })
    })
    app.get('/u/:name/:minute/:title',function (req,res) {
        Post.getOne(req.params.name,req.params.minute,req.params.title,function (err,post) {
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('article',{
                title:'文章页面详情',
                post:post,
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            })
        })
    })
    app.get('/edit/:name/:minute/:title',checklogin);
    app.get('/edit/:name/:minute/:title',function (req,res) {
        var currentUser=req.session.user;
        Post.edit(currentUser.name,req.params.minute,req.params.title,function (err,post) {
            if(err){
                req.flash('error',err);
                return res.redirect('back');

            }
            res.render('edit',{
                title:"编辑",
                post:post,
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            })
        })
    })
    app.post('/edit/:name/:minute/:title',checklogin);
    app.post('/edit/:name/:minute/:title',function (req,res) {
        var currentUser=req.session.user;
        Post.update(currentUser.name,req.params.minute,req.params.title,req.body.post,function (err) {
            var url=encodeURI('/u/'+req.params.name+'/'+req.params.minute+'/'+req.params.title);
            if(err){
                req.flash('error',err);
                res.redirect(url);
            }
            req.flash('success','修改成功');
            res.redirect(url);
        })
    })
    app.get('/remove/:name/:minute/:title',checklogin);
    app.get('/remove/:name/:minute/:title',function (req,res) {
        var currentUser=req.session.user;
        Post.remove(currentUser.name,req.params.minute,req.params.title,function (err) {
            if(err){
                req.flash('error',err);
                return res.redirect('back');
            }
            req.flash('success','删除成功');
            res.redirect('/')
        })
    })
    app.post('/comment/:name/:minute/:title',function (req,res) {
        var date=new Date();
        var time = date.getFullYear() + '-' + (date.getMonth() < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1 ) + '-' + (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + ' ' + (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':' +
            (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());
        var comment={
            name:req.body.name,
            time:time,
            content:req.body.content
        };
        var newComment=new Comment(req.params.name,req.params.minute,req.params.title,comment);
        newComment.save(function (err) {
            if(err){
                req.flash('error',err);
                return res.redirect('back');
            }
            req.flash("success",'留言成功');
            res.redirect('back');
        })
    })

//存档路由
    app.get('/archive',function (req,res) {
        Post.getArchive(function (err,posts) {
            if(err){
                req.flash('error',err);
                return res.redirect('/')
            }
            res.render('archive',{
                title:'存档',
                posts:posts,
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            })
        })
    })

    app.get('/tags',function (req,res) {
        Post.getTags(function (err,posts) {
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('tags',{
                title:'标签',
                posts:posts,
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            })
        })
    })
    //添加带有参数的tags路由
    //根据标签链接获取所有文章
    app.get('/tags/:tag',function (req,res) {
        Post.getTag(req.params.tag,function (err,posts) {
            if(err){
                req.flash('error',err)
                return res.redirect('/')
            }
            res.render('tag',{
                title:'TAG'+req.params.tag,
                posts:posts,
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString(),
            })
        })
    })
    app.get('/search',function (req,res) {
        Post.search(req.query.keyword,function (err,posts) {
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('search',{
                title:'SEARCH'+req.query.keyword,
                posts:posts,
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            })
        })
    })
    app.get('/about',checklogin)
    app.get('/about',function (req,res) {
        // Post.getAbout(function (err,posts) {
        //     if(err){
        //         req.flash('error',err);
        //         return res.redirect('/')
        //     }
            res.render('about',{
                title:'关于',

                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            })
        // })
    })
}
