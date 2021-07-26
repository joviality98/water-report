const { querySql, queryOne } = require('../utils/index');
const boom = require('boom');
const { validationResult } = require('express-validator');
const { CODE_ERROR, CODE_SUCCESS } = require('../utils/constant');
const persistent = require("fs-persistent");
const { setItem } = persistent();

function queryAll(req, res, next) {
  const err = validationResult(req);
  // 如果验证错误，empty不为空
  if (!err.isEmpty()) {
    // 获取错误信息
    const [{ msg }] = err.errors;
    // 抛出错误，交给我们自定义的统一异常处理程序进行错误返回 
    next(boom.badRequest(msg));
  } else {

    let query = `select old_name,new_name from name_wincc`;
    querySql(query)
    .then(data => {
      if (!data || data.length === 0) {
        res.json({ 
        	code: CODE_ERROR, 
        	msg: '暂无数据', 
        	data: null 
        })
      } else {
        setItem("fieldNames",data)
        res.json({
          code: CODE_SUCCESS, 
        	msg: '查询数据成功', 
        	data: data 
        })
      }
    })
  }
}

function addName(req, res, next){
  const err = validationResult(req);
  // 如果验证错误，empty不为空
  if (!err.isEmpty()) {
    // 获取错误信息
    const [{ msg }] = err.errors;
    // 抛出错误，交给我们自定义的统一异常处理程序进行错误返回 
    next(boom.badRequest(msg));
  } else {
    const { oldName,newName } = req.body;
    findNames(oldName,2).then( item => {
      if(item){
        res.json({ 
          code: CODE_ERROR, 
          msg: '字段名不能重复', 
          data: null 
        })
      }else{
        const query = `insert into name_wincc(old_name,new_name) values('${oldName}','${newName}')`;
        querySql(query).then(data => {
          if(!data || data.length === 0){//插入失败，状态码为0
            res.json({
              code:CODE_ERROR,
              msg:"添加数据失败",
              data:null
            })
          }else{
            res.json({
              code:CODE_SUCCESS,
              msg:'添加数据成功',
              data:null
            })
          }
        })
      }
    })
    saveFieldNames();
    
  }
}

function editName(req, res, next) {
  const err = validationResult(req);
  // 如果验证错误，empty不为空
  if (!err.isEmpty()) {
    // 获取错误信息
    const [{ msg }] = err.errors;
    // 抛出错误，交给我们自定义的统一异常处理程序进行错误返回 
    next(boom.badRequest(msg));
  } else {
    const { oldName,newName } = req.body;
    findNames(oldName,2).then( item => {
      if(item){
        const query = `update name_wincc set new_name='${newName} where old_name = '${oldName}''`;
        querySql(query).then(data => {
          console.log(data);
          if (!data || data.length === 0) {
            res.json({ 
              code: CODE_ERROR, 
              msg: '操作数据失败', 
              data: null 
            })
          } else {
            res.json({ 
              code: CODE_SUCCESS, 
              msg: '操作数据成功', 
              data: null 
            })
          }
        })
      }else{
        res.json({ 
          code: CODE_ERROR, 
          msg: '参数错误或数据不存在', 
          data: null 
        })
      }
    })
    saveFieldNames();
  }
}

function batchDeal(req, res, next) {
  const err = validationResult(req);
  // 如果验证错误，empty不为空
  if (!err.isEmpty()) {
    // 获取错误信息
    const [{ msg }] = err.errors;
    // 抛出错误，交给我们自定义的统一异常处理程序进行错误返回 
    next(boom.badRequest(msg));
  } else {
    const { list } = req.body;
    let arr = JSON.parse(list);

    // 状态码 1：成功，0：失败
    let status = 1;
    for(let i = 0; i < arr.length; i++){
      //遍历传入的数组
      let temp = arr[i];
      const oldName = temp.old_name;
      const newName = temp.new_name;

      findNames(oldName,2).then( item => {
        //查找数据库中是否用该字段的别名
        if(item){ 
          //已经有别名，修改以前的别名
          const query = `update name_wincc set new_name='${newName}' where old_name = '${oldName}'`;
          querySql(query).then(data => {
            if (!data || data.length === 0) {//更新失败，状态码为0
              status = 0
            } 
          })
        }else{
          //没有别名，添加别名
          if(newName != "" || newName != null){
            const query = `insert into name_wincc(old_name,new_name) values('${oldName}','${newName}')`;
            querySql(query).then(data => {
              if(!data || data.length === 0){//插入失败，状态码为0
                status = 0
              }
            })
          }
          
        }
      })
    }
    saveFieldNames();
    if(status == 1){
      res.json({
        code:CODE_SUCCESS,
        msg:"操作成功",
        data:null
      })
    }else{
      res.json({
        code:CODE_ERROR,
        msg:"操作失败，传入的参数错误",
        data:null
      })
    }
    
  }
}

function deleteName(req, res, next){
  const err = validationResult(req);
  if (!err.isEmpty()) {
    const [{ msg }] = err.errors;
    next(boom.badRequest(msg));
  } else {
    let { old_name, new_name } = req.body;
    findNames(old_name, 2)
    .then(task => {
      if (task) {
        const query = `delete from name_wincc where old_name = '${old_name}'`;
        querySql(query)
        .then(data => {
          if (!data || data.length === 0) {
            res.json({ 
              code: CODE_ERROR, 
              msg: '删除数据失败', 
              data: null 
            })
          } else {
            res.json({ 
              code: CODE_SUCCESS, 
              msg: '删除数据成功', 
              data: null 
            })
          }
        })
      } else {
        res.json({ 
          code: CODE_ERROR, 
          msg: '数据不存在', 
          data: null 
        })
      }
    })
    saveFieldNames();
  }
}

// 通过任务名称或ID查询数据是否存在
function findNames(param, type) {
  let query = null;
  if (type == 1) { // 1:添加类型 2:编辑或删除类型
    const {oldName,newName} = param
    query = `select old_name,new_name from name_wincc where old_name='${oldName}' and new_name = '${newName}'`;
  } else {
    query = `select old_name,new_name from name_wincc where old_name='${param}'`;
  }
  return queryOne(query);
}

function saveFieldNames(){
  let query = `select old_name,new_name from name_wincc`;
  querySql(query)
  .then(data => {
    if (!data || data.length === 0) {
      setItem("fieldNames",[])
    } else {
      setItem("fieldNames",data)
    }
  })
}
module.exports={
  queryAll,
  addName,
  editName,
  deleteName,
  batchDeal
}