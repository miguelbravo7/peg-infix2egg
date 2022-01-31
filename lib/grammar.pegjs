{
  const { Value, Word, Apply } = require('@ull-esit-pl-1920/p7-t3-egg-2-miguel');

  const makeApply = (value, ...params) => {
    value = typeof value === 'string' ? new Word({value: value}) : value;
    let app = new Apply(value);
    app.args.push(...params);
    return app;
  }

  const reduceApply = (left, right) => right.reduce((acc, [op, val]) => {
    let app = new Apply(op);
    app.args.push(acc);
    app.args.push(val);
    return app;
  }, left);
}

start 'start'
  = block
  
block 'block'
  = LC statements:statement* RC { return makeApply('do', ...statements);} 

statement 'statement'
  = decl:declaration SEMICOLON?                                                   { return decl;}
  / IF par:parenthesis b1:block b2:(ELSE IF parenthesis block)* b3:(ELSE block)?  {
                                                                                    let iblocks = [par, b1];
                                                                                    b2.forEach(e => iblocks.push(e[2], e[3]));
                                                                                    if(b3) iblocks.push(b3[1]);
                                                                                    let appacc = iblocks[iblocks.length-1];
                                                                                    for(let i=iblocks.length-2; 0<i; i-=2){
                                                                                      appacc = makeApply('if', iblocks[i-1], iblocks[i], appacc);
                                                                                    }
                                                                                    return appacc;
                                                                                  }
  / FOR LP init:declaration? SEMICOLON condition:comparison? SEMICOLON post:expr? RP loop:block   { return makeApply('for', init, condition, post, loop)}
  / WHILE par:parenthesis b:block                                                 { return makeApply('while', par, b);}
  / FUNC id:WORD? LP p1:WORD? p2:(COMMA WORD)* RP b:block                         {
                                                                                    let parameters = p2.map(e=>e[1]); 
                                                                                    if(p1) parameters.unshift(p1); 
                                                                                    let res = makeApply('fun', ...parameters, b);
                                                                                    if(id) res = makeApply('def', id, res);
                                                                                    return res;
                                                                                  }
  / AT annotation:WORD id:WORD apply:apply SEMICOLON?                             {
                                                                                    apply.forEach((e) => {
                                                                                      if(Array.isArray(e)) {id = makeApply(id, ...e)}
                                                                                      else {id = makeApply(id, e)}
                                                                                    }); 
                                                                                    return makeApply(annotation, id);
                                                                                  }
  / exp:expr SEMICOLON?                                                           { return exp;}

declaration 'declaration'
  = VAR id:WORD assign:(ASSIGN expr)? { return makeApply('def', id, assign ? assign[1] : undefined);}

expr 'expr'
  = sentences:(leftVal ASSIGN)* decl:comparison  { 
                                                    let val = decl;
                                                    sentences.reverse().forEach(e => val = makeApply(e[1], ...e[0], val));
                                                    return val;
                                                  }

leftVal 'leftVal'
  = element:WORD indexes:(DOT WORD / LB expr RB)*   {
                                                      if (indexes.length) {
                                                        return [element, ...indexes.map(e=> {
                                                            if (e[1] instanceof Word) {
                                                              return new Value({value: e[1].name});
                                                            } else {
                                                              return e[1];
                                                            }
                                                          })];
                                                      } else {
                                                        return [element];
                                                      } 
                                                    }

comparison 'comparison'
  = left:additive rest:(LOGICOP additive)* { return reduceApply(left, rest);}

additive 'additive'
  = left:multiplicative rest:(ADDOP multiplicative)* { return reduceApply(left, rest);}

multiplicative 'multiplicative'
  = left:fact rest:(MULOP fact)* { return reduceApply(left, rest);}

fact 'fact'
= parenthesis
/ array
/ id:WORD apply:apply               { 
                                      apply.forEach((e) => {
                                        if(Array.isArray(e)) {id = makeApply(id, ...e)}
                                        else {id = makeApply(id, e)}
                                      }); 
                                      return id;
                                    }
/ LC pair:(value COLON statement)? pairs:(COMMA value COLON statement)* COMMA? RC  
                                    {
                                      let parameters = pairs.reduce((acc, elem)=>{
                                        acc.push(new Value({value: elem[1].name || elem[1].value}));
                                        acc.push(elem[3]);
                                        return acc;
                                      }, []);
                                      if (pair.length) {
                                        parameters.unshift(new Value({value: pair[0].name || pair[0].value}), pair[2]);
                                      }
                                      return makeApply('object', ...parameters);
                                    }
/ value

apply 'apply'
= LP val:expr? vals:(COMMA expr)* RP ap:apply   { 
                                                  let res = [...[val].filter(e=>e!=null), ...vals.map(e=>e[1])];
                                                  return [res, ...ap];
                                                }
/ DOT id:WORD ap:apply                          {
                                                  return [new Value({value: id.name}), ...ap];
                                                }
/ LB expr:expr RB ap:apply                      { return [expr, ...ap];}
/ ''                                            { return [];}

array 'array'
= LB RB                              { return makeApply('array');}
/ LB val:expr vals:(COMMA expr)* RB  { return makeApply('array', val, ...vals.map(e=>e[1]));}

parenthesis 'parenthesis'
= LP exp:expr RP { return exp;}

value 'value'
= elem:(VALUE / WORD) // indexes:(DOT WORD / LB expr RB / LP val:expr? vals:(COMMA expr)* RP)* { return indexes.length ? makeApply('element', elem, ...indexes.map(e=>e[2])) : elem;}

VALUE 'VALUE'
  = STRING / NUMBER

_ = [ \t\n\r]*COMMENT?  { return null; }
//\u2028\u2029

COMMENT 
  = ("#" / "//") [^\n\r]* _
  / "/*" [^\*]* "*/" _

ADDOP = PLUS / MINUS
MULOP = MULT / DIV
LOGICOP = _ op:('=='/ '!='/ '>='/ '>'/ '<='/ '<') _  { return new Word({value: op});}

COMMA = _","_           { return null; }
DOT = _"."_             { return null; }
SEMICOLON = _";"_       { return null; }
COLON = _":"_           { return null; }
AT = _"@"_              { return null; }
PLUS = _"+"_            { return new Word({value:"+"}); }
MINUS = _"-"_           { return new Word({value:"-"}); }
MULT = _"*"_            { return new Word({value:"*"}); }
DIV = _"/"_             { return new Word({value:"/"}); }
LP = _"("_              { return null; }
RP = _")"_              { return null; }
LC = _"{"_              { return null; }
RC = _"}"_              { return null; }
LB = _"["_              { return null; }
RB = _"]"_              { return null; }
ASSIGN = _'='!'='_      { return new Word({value:'='}); }

IF = _"if"_             { return null; }
ELSE = _"else"_         { return null; }
WHILE = _"while"_       { return null; }
FOR = _"for"_           { return null; }
FUNC = _"function"_     { return null; }
VAR = _"var"_           { return null; }

NUMBER = _ n:$[0-9]+_                     { return new Value({value: parseInt(n, 10)});}
STRING = _ n:$('"' ( [^"'\'] / '.')*'"')_ { return new Value({value: n.substring(1, n.length-1)});}
WORD = _ id:$([a-z_]i$([a-z0-9_]i*))_     { return new Word({value: id});}