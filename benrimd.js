'use strict';

const MD_CONFIG_DEFAULT = {
  TOKEN_LIST : {
    block:[
      {
        start:'&&&math',end:'&&&',
        gen:content=>
          `<div class="math-exp">\$\$${content}\$\$</div>`,
        parse : false,
      },
      {start : '&&&sup',end:'&&&',gen:content=>`<div class="supplement" title="注">${content}</div>`,parse:true},
    ],
    
    inline:[
      {start:"*",end:"*",gen:str=>`<strong>${str}</strong>`,parse:1},
      {start:"_",end:"_",gen:str=>`<sub>${str}</sub>`,parse:1},
      {start:"##",end:"",gen:str=>`<h3>${str}</h3>`,parse:1},
      {start:"#",end:"",gen:str=>`<h2>${str}</h2>`,parse:1},
      {start : '\\(',end:'\\)',gen:content=>`\\(${content}\\)#`,parse:false},//影響なくす
    ],
  }
}


const MD = function(indent_letter){
  this.CONFIG = MD_CONFIG_DEFAULT;
  this.indent_letter = indent_letter;
  this.parse = MD_parse;
}


function MD_parse(md){
  return this.parseBracket(md.split('\n'),'','',true)[0];
}

MD.prototype.parseBracket = function(lines,endstr,indent,pflag){
  /*
    先にblockから処理
  */
  
  const block_list = this.CONFIG.TOKEN_LIST.block;
  endstr = endstr ? endstr.toString():'';
  indent = indent ? indent : '';
  const line_length = lines.length;
  pflag = !!pflag;
  
  let stack = [];
  let tmp = [];
  let rest = lines;
  
  
  let first_token = null;
  
  
  //開始探索
  lineloop:while(rest.length){
    let line = rest[0];
    rest.shift();
    
    //終了チェック
    if(endstr && line == endstr){
        //ブロック終了
        if(tmp.length)stack.push(tmp.join('\n' +(pflag?(indent+'<br>'):'')));//tmpをstackの末尾に追加
        return [(pflag?('\n'+indent):'')+stack.join('\n'+(pflag ? indent :'')),rest];
    }
    
    if(pflag){
    //行頭チェック
    for(let block_i in block_list){
      
      const token = block_list[block_i];
      
      if(line == token.start){
        //トークンと先頭一致
        
        stack.push(tmp.join('\n'+indent+'<br>'));//tmp追加
        tmp = [];
        
        const innerLexed = this.parseBracket(
          rest,
          token.end,
          indent+this.indent_letter,
          token.parse
        );//再帰的に探索
        rest = innerLexed[1];   //rest 更新
        stack.push(token.gen(innerLexed[0]+(token.parse?('\n'+indent):'')));//stack追加
        continue lineloop;
      }
    }
    }
    
    tmp.push(
      pflag? this.parseLine(line) : line
    );//tmp更新
  }
  //開始探索おわり(終了)
  
  
  stack.push(tmp.join('\n'+(pflag?(indent+'<br>'):'')));
    //余分return
  return [stack.join('\n'+(pflag?indent:'')),rest];
}



MD.prototype.parseInlineBracket = function(line,endstr,pflag){
  /*
    先にblockから処理
  */
  
  const token_list = this.CONFIG.TOKEN_LIST.inline;
  endstr = endstr ? endstr.toString():'';
  const endstrlen = endstr.length;
  const line_length = line.length;
  pflag = !!pflag;
  
  let stack = '';
  let tmp = '';
  let rest = line;
  
  
  //開始探索
  lineloop:while(rest.length){
    
    //終了チェック
    if(endstr && rest.slice(0,endstrlen) == endstr){
        //ブロック終了
        stack += tmp;//tmpをstackの末尾に追加
        return [stack,rest.slice(endstrlen)];
    }
    
    
    if(pflag){
    //行頭チェック
    for(let token_i in token_list){
      
      const token = token_list[token_i];
      
      if(rest.slice(0,token.start.length) == token.start){
        //トークンと先頭一致
        
        stack += tmp;//tmp追加
        tmp = '';
        
        const innerLexed = this.parseInlineBracket(
          rest.slice(token.start.length),
          token.end,
          token.parse
        );//再帰的に探索
        rest = innerLexed[1];   //rest 更新
        stack += token.gen(innerLexed[0]);//stack追加
        continue lineloop;
      }
    }
    }
    
    tmp += rest[0];//tmp更新
    rest = rest.slice(1);
  }
  //開始探索おわり(終了)
  
  
  stack += tmp;
    //余分return
  return [stack,rest];
}


MD.prototype.parseLine = function(line){
  let res= this.parseInlineBracket(line,'',true)[0];
  return res;
}



const mdt=`
#マークダウン
&&&code
123は*つ_よい_*です
&&&
`;

//const input = require("fs").readFileSync("/dev/stdin", "utf8");


const md = new MD(' ');

console.log(md.parse(mdt));
