const jwt = require('jsonwebtoken');

function getuser(token){
    if(!token){
        return null;
    }
    try{
        return jwt.verify(token,process.env.jwt_key);
    } catch{
        return null;
    }
}

function get_token(user){
    
    const token = jwt.sign({
        id:user._id,
        wallet_id : user.metamask_wallet_id
    },process.env.jwt_key);

    return token;
}

module.exports = {getuser , get_token};