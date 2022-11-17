const level_5_paths = ['/requests','/requests/add','/requests/edit','/requests/view','/meetings'];
const level_4_3_2_paths = ['/requests','/requests/view','/meetings'];
const level_1_paths = [...level_4_3_2_paths,'/meetings/add','/meetings/edit',,'/reports','/meetings/users','/users'
    ,'/users/add','/users/edit'];

module.exports = (req, res, next) => {
    // req.session.user = {
    //     username: 1,
    //     level: 1
    // }
    // const split_url = req.originalUrl.split("/");
    // const url = split_url.length > 3 ? `/${split_url[1]}/${split_url[2]}` : req.originalUrl
    if(!req.session.user) return res.redirect("/");
    else{
    //     if ((req.session.user?.level === 5 && level_5_paths.includes(url)) ||
    //         ([2,3,4].includes(req.session.user?.level) && level_4_3_2_paths.includes(url)) || 
    //         (req.session.user?.level === 1 && level_1_paths.includes(url))) {
            return next();
        // } else {
        //     return res.render("401");
        // }
    }
}