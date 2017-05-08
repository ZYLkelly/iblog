/**
 * Created by Administrator on 2017/4/20.
 */
var mongo=require('./db');
var markdown=require("markdown").markdown;
//几个参数的位置很重要，要和路由里面的位置相对应
function Post(name,title,tags,post) {
    this.name=name;
    this.title=title;
    this.post=post;
    this.tags=tags;
}
module.exports=Post;

//保存文章
Post.prototype.save=function (callback) {
    var date=new Date();
    var time={
        date:date,
        year:date.getFullYear(),
        month:date.getFullYear() + '-' + (date.getMonth() < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1),
        day:date.getFullYear() + '-' + (date.getMonth() < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-' + (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()),
        minute:date.getFullYear() + '-' + (date.getMonth() < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1 ) + '-' + (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + ' ' + (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':' +
        (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds())
    }
    var post={
        name:this.name,
        time:time,
        title:this.title,
        post:this.post,
        comments:[],
        tags:this.tags,
        pv:0
    }
    mongo.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection("posts",function (err,collection) {
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.insert(post,{
                safe:true
            },function (err,post) {
                mongo.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            })
        })
    })
}

//获取所有文章
Post.getTen=function (name,page,callback) {
    mongo.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err);
            }
            var query={};
            if(name){
                query.name=name;
            }
            collection.count(query,function (err,total) {
                collection.find(query,{
                    skip:(page-1)*3,
                    limit:3
                }).sort({
                    time:-1
                }).toArray(function (err,docs) {
                    mongo.close();
                    if(err){
                        return callback(err);
                    }
                    docs.forEach(function (doc) {
                        doc.post=markdown.toHTML(doc.post)
                        console.log(doc)
                    })
                    callback(null,docs,total);
                })
            })
        })
    })
}

//获取一篇文章
Post.getOne=function (name,minute,title,callback) {
    mongo.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.findOne({
                "name":name,
                "time.minute":minute,
                'title':title
            },function (err,doc) {
                if(err){
                    mongo.close();
                    return callback(err);
                }
                if(doc){
                    collection.update({
                        "name":name,
                        "time.minute":minute,
                        "title":title
                    },{
                        $inc:{'pv':1}
                    },function (err) {
                        mongo.close();
                        if(err){
                            return callback(err);
                        }
                    })
                    //如果在这里出现了foreach的问题，是进程问题，要先看是不是数据库出了问题，然后先把数据库清空再看看
                    doc.post=markdown.toHTML(doc.post);
                    console.log(doc.comments)
                    doc.comments.forEach(function (comment) {
                        comment.content = markdown.toHTML(comment.content);
                        // console.log(comment)
                    });
                    callback(null,doc);
                }
            })
        })
    })
}

//返回原始发表的内容
Post.edit=function (name,minute,title,callback) {
    mongo.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.findOne({
                'name':name,
                'time.minute':minute,
                'title':title
            },function (err,doc) {
                mongo.close();
                if(err){
                    return callback(err);
                }
                callback(null,doc);
            })
        })
    })
}
Post.update=function (name,minute,title,post,callback) {
    mongo.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.update({
                'name':name,
                'time.minute':minute,
                'title':title
            },{
                $set:{post:post}
            },function (err) {
                mongo.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            })
        })
    })
}
Post.remove=function (name,minute,title,callback) {
    mongo.open(function (err,db) {
        if(err){
           return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.remove({
                'name':name,
                'time.minute':minute,
                'title':title
            },{
              w:1
            },function (err) {
                mongo.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            })
        })
    })
}
Post.getArchive=function (callback) {
    mongo.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.find({},{
                'name':1,
                'title':1,
                'time':1
            }).sort({
                time:-1
            }).toArray(function (err,docs) {
                mongo.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);
            })
        })
    })
}

Post.getTags=function (callback) {
    mongo.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.distinct('tags',function (err,docs) {
                mongo.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);
            })
        })
    })
}
Post.getTag=function (tag,callback) {
    mongo.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err);
            }
            collection.find({
                'tags':tag
            },{
                'name':1,
                'title':1,
                'time':1
            }).sort({
                time:-1
            }).toArray(function (err,docs) {
                mongo.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);
            })
        })
    })
    Post.search=function (keyword,callback) {
        mongo.open(function (err,db) {
            if(err){
                return callback(err)
            }
            db.collection('posts',function (err,collection) {
                if(err){
                    mongo.close()
                    return callback(err)
                }
                var pattern=new RegExp(keyword,'i')
                collection.find({
                    'title':pattern
                },{
                    'name':1,
                    'time':1,
                    'title':1
                }).sort({
                    time:-1
                }).toArray(function (err,docs) {
                    mongo.close()
                    if(err){
                        return callback(err)
                    }
                    callback(null,docs)
                })
            })
        })
    }
}
Post.search=function (keyword,callback) {
    mongo.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err);
            }
            var pattern=new RegExp(keyword,'i');
            collection.find({
                'title':pattern
            },{
                'name':1,
                'time':1,
                'title':1
            }).sort({
                time:-1
            }).toArray(function (err,docs) {
                mongo.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);
            })
        })
    })
}
