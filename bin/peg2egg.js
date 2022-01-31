const PEG = require("../lib/grammar.js");
const {topEnv} = require("@ull-esit-pl-1920/p7-t3-egg-2-miguel");
const input = process.argv[2] || ` { 
    var a =  0 ;
 
    function sum ( x , y ) { 
        x + y; 
    }

    // Assign
    var inc = sum(2) ;

    while (a < 10) {
        print( a );
        a = inc(a);
    }

    /*
    Implementacion de objetos
    */

    var b = {
        a : 10,
        "str": 1>2
    };

    var str = "str";
    print( b.str );

    # comment

    @ print
    sum(4, 8);

    if(a < 9) {
        print(1)
    } else if ( a == 9 ) {
        print(2)
    } else {
        print(3)
    }

    for ( var i = 0 ; i < 5 ; i = i + 1 ) {
        print(i)
    }

    var arro = [0, [1, 2]]
    print(arro(1)[0])
    print(arro[0+1] )    

    var x = { 
        "c" :   0,
        "gc" :  function() { this.c },
        "sc":  function(value) { this.c = value},
        "inc": function() { this.c =  this.c + 1 }
      }
    print(x.c); 
    print(x.gc());  
    print(x.sc(5));
    print(x.gc()) 

} `; 
console.log(`Processing <${input}>`);
var tree = PEG.parse(input);
console.log(tree.evaluate(topEnv));