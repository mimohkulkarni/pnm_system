const public_paths = ['/requests','/meetings','/requests/view']
const level_5_paths = [...public_paths,'/requests/add','/requests/edit','/requests/delete'];
const level_1_paths = [...public_paths,'/requests/setCategory','/requests/close','/requests/forwardToNextMeeting',
    '/requests/getCategoryUsers','/requests/freeze','/meetings/add','/meetings/edit','/meetings/delete',
    '/reports','/users','/users/edit',,'/users/add','/users/activate','/users/deactivate'];
const level_2_paths = [...public_paths,'/requests/setApproval','/requests/getCategoryUsers'];
const level_3_paths = [...public_paths,'/requests/addRemarks','/requests/forward'];
const level_4_paths = [...public_paths,'/requests/addRemarks',"/requests/editOSRemarks",'/requests/forward'];

module.exports = (req, res, next) => {
    // req.session.user = {
    //     username: 1,
    //     level: 1
    // }
    const split_url = req.originalUrl.split("/");
    let url = split_url.length > 3 ?  `/${split_url[1]}/${split_url[2]}` : req.originalUrl
    if(url.includes("?")) url = url.split("?")[0];
    if(!req.session.user) return res.redirect("/");
    else{
        if ((req.session.user?.level === 5 && level_5_paths.includes(url)) ||
            (req.session.user?.level === 4 && level_4_paths.includes(url)) ||
            (req.session.user?.level === 3 && level_3_paths.includes(url)) ||
            (req.session.user?.level === 2 && level_2_paths.includes(url)) ||
            (req.session.user?.level === 1 && level_1_paths.includes(url))) {
            return next();
        } else {
            return res.redirect("/401");
        }
    }
}