const level_4_paths = ['/home','/requests','/requests/add','/requests/edit','/requests/view'];

module.exports = (req, res, next) => {
    if(!req.session.user) return res.redirect("/");
    else{
        // if (req.session.user?.level === 4 && level_4_paths.includes(req.session.user?.level)) {
            return next();
        // } else {
        //     return res.render("401");
        // }
    }
}