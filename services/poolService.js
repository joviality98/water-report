const { querySql, queryOne,format } = require('../utils/index');
const boom = require('boom');
const { validationResult } = require('express-validator');
const { CODE_ERROR, CODE_SUCCESS } = require('../utils/constant');
const persistent = require("fs-persistent");
const { getItem, removeItem } = persistent();

function searchByDate(req, res, next) {
  const err = validationResult(req);
  // 如果验证错误，empty不为空
  if (!err.isEmpty()) {
    // 获取错误信息
    const [{ msg }] = err.errors;
    // 抛出错误，交给我们自定义的统一异常处理程序进行错误返回 
    next(boom.badRequest(msg));
  } else {
    let { date, flag } = req.query;
    flag = flag ? flag : 1;
    
    let arr = date.split("-");
    let year = arr[0];
    let month = arr[1] ? arr[1] : "";
    let day = arr[2] ? arr[2] : "";

    let sql = '';
    if(flag == 1){
       sql =  "select MLSS1101,ORP1101,NO3_N1101,MLSS1102,ORP1102,DO1102,DO1101,PH1101,LDT1101";
       sql = concatCondition(sql,year,month,day);
    }else{
       sql =  "select MLSS1101,ORP1101,NO3_N1101,MLSS1102,ORP1102,DO1102,DO1101,PH1101,LDT1101";
       sql = concatCondition(sql,year,month,day);
    }

    querySql(sql)
    .then( async data => {
      if (!data || data.length === 0) {
        res.json({ 
        	code: CODE_ERROR, 
        	msg: '暂无数据', 
        	data: null 
        })
      } else {
        let fieldNames = getItem("fieldNames")
        if(fieldNames){
          const nameArr = [];
          for( let i = 0; i < data.length; i++){
            for (const key in data[i]) {
              if(key == 'date'){
                //时间格式化
                let d = new Date(data[i][key]);
                data[i][key] = format(d)
              }
              let name = fieldNames.filter(item => { return item.old_name==key})
              let temp = JSON.parse(JSON.stringify(data[i][key])) 
              if(name.length>0 && name[0].new_name != ""){
                //别名对应
                let n = name[0].new_name;
                data[i][n] = temp
                delete data[i][key]
              }else{
                delete data[i][key]
                data[i][key] = temp
              }
              //字段别名记录
              if(i == 0){
                const t = name[0]?name[0]:{old_name:key,new_name:""}
                nameArr.push(t);
              }
            }
            //将日期放置到第一位
          }
          //属性名排序
          let keyArr = nameArr.map(item => { return item.new_name?item.new_name:item.old_name})
                .reduce((prev,cur,data) => { cur == "日期"? prev.unshift(cur):prev.push(cur); return prev},[]);
          
          const dataSort = data.map(item => {
            const obj = {}
            for(let i = 0; i < keyArr.length; i++){
              let k = keyArr[i]
              obj[k] = item[k]
            }
            return obj
          })
          
          res.json({
            code:CODE_SUCCESS,
            msg:"查询成功",
            data:{
              list:dataSort,
              alias:nameArr,
            }
          })
        }else{
          res.json({
            code:CODE_SUCCESS,
            msg:"查询成功",
            data:data
          })
        }
      }
    })
  }
}

function concatCondition(sql,year,month,day){
  if(year.length != 0 && month.length != 0 && day.length != 0 ){
      sql += ",date from biochemical_pool ";
      sql += " where DATE_FORMAT(date,'%Y') =" + year +" and DATE_FORMAT(date,'%m') =" +month +" and DATE_FORMAT(date,'%d') =" +day +" order by date ASC";
  }else if(year.length != 0 && month.length != 0) {
      sql += ", date from biochemical_pool ";
      sql += " where DATE_FORMAT(date,'%Y') =" + year +" and DATE_FORMAT(date,'%m') =" +month +" order by date ASC" ;
  }else if(year.length != 0){
      sql += ",date from biochemical_pool ";
      sql+=" where DATE_FORMAT(date,'%Y') =" + year +" order by date ASC";
  }
  return sql;
}

module.exports={
  searchByDate
}