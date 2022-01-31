const { Lexer, Value, Word, Apply } = require('@ull-esit-pl-1920/p7-t3-egg-2-miguel');

module.exports = class InfixParser {
    constructor(program) {
        this.lexer = new Lexer(program);
        this.COM_OP = ['==', '!=', '>', '>=', '<', '<=', '=', '&&', '||'];
        this.SUM_OP = ['+', '-'];
        this.FAC_OP = ['*', '/'];
    }

    get lookahead() {
        return this.lexer.lookahead;
    }

    isWord(id) {
        return /[a-zA-Z_]\w*/.test(id);
    }

    expected(string_value) {
        if (this.lookahead.value != string_value) {
            throw new SyntaxError(`Unexpect syntax:${
                this.lexer.program.slice(this.lexer.last_index_arr[this.lexer.last_index_arr_index], this.lexer.last_index_arr[this.lexer.last_index_arr_index] + 10)
                } \n${JSON.stringify(this.lexer.token_arr[this.lexer.token_arr_index], null, 2)}`);
        }
    }

    parse() {
        this.lexer.nextToken();
        let result = this.parseBlock();
        if (this.lexer.lookahead != null) {
            throw EvalError('Unexpected token at end of parsing: ' + this.lookahead);
        }
        return result;
    }

    parseBlock() {
        this.expected('{');
        let app_do = new Apply(this.makeWord('do'));
        this.lexer.nextToken();
        while (this.lookahead.value != '}') {
            app_do.args.push(this.parseStatement());
        }
        this.lexer.nextToken();
        return app_do;
    }

    parseStatement() {
        switch (this.lookahead.value) {
            case 'if':
                return this.parseIf();
            case 'while':
                return this.parseWhile();
            case 'function':
                return this.parseFunction();
            case 'var':
                return this.parseDeclaration();
            default:
                let exp = this.parseExp();
                // this.expected(';');
                // this.lexer.nextToken();
                return exp;
        }
    }

    parseIf() {
        this.expected('if');
        let app_if = new Apply(this.makeWord('if'));
        this.lexer.nextToken();
        app_if.args.push(this.parseParenthesis());
        app_if.args.push(this.parseBlock());
        if (this.lookahead.value == 'else') {
            this.lexer.nextToken();
            if (this.lookahead.value == 'if') {
                app_if.args.push(this.parseIf());
            } else {
                app_if.args.push(this.parseBlock());
            }
        } else {
            app_if.args.push(new Apply(this.makeWord('do')));
        }
        return app_if;
    }

    parseWhile() {
        this.expected('while');
        let app_while = new Apply(this.makeWord('while'))
        this.lexer.nextToken();
        app_while.args.push(this.parseParenthesis());
        app_while.args.push(this.parseBlock());
        return app_while;
    }

    parseFunction() {
        this.expected('function');
        let define = new Apply(this.makeWord('define'));
        let fun = new Apply(this.makeWord('fun'));
        this.lexer.nextToken();
        define.args.push(new Word(this.lookahead));
        this.lexer.nextToken();
        this.expected('(');
        this.lexer.nextToken();
        fun.args.push(new Word(this.lookahead));
        this.lexer.nextToken();
        while (this.lookahead.value == ',') {
            this.lexer.nextToken();
            fun.args.push(new Word(this.lookahead));
            this.lexer.nextToken();
        }
        this.lexer.nextToken();
        fun.args.push(this.parseBlock());
        define.args.push(fun);
        return define;
    }

    parseDeclaration() {
        this.expected('var');
        this.lexer.nextToken();
        let define = new Apply(this.makeWord('define'));
        define.args.push(new Word(this.lookahead));
        this.lexer.nextToken();
        if (this.lookahead.value == '=') {
            this.lexer.nextToken();
            define.args.push(this.parseExp());
        }
        return define;
    }

    parseLeftVal() {
        if (!this.isWord(this.lookahead.type)) {
            throw TypeError('Assining a value to a literal.')
        }
        let app_element = new Apply(this.makeWord('element'))
        app_element.args.push(new Word(this.lookahead));
        this.lexer.nextToken();
        while (this.lookahead.value == '[') {
            app_element.args.push(this.parseExp());
            this.expected(']')
            this.lexer.nextToken();
        }
        return app_element;
    }

    parseArray() {
        this.expected('[');
        this.lexer.nextToken();
        let app_array = new Apply(this.makeWord('array'));
        if (this.lookahead.value != ']') {
            app_array.args.push(this.parseExp());
            while (this.lookahead.value == ',') {
                this.lexer.nextToken();
                app_array.args.push(this.parseExp());
            }
        }
        this.lexer.nextToken();
        return app_array;
    }

    parseParenthesis() {
        this.expected('(');
        this.lexer.nextToken();
        let result = this.parseExp();
        this.expected(')');
        this.lexer.nextToken();
        return result;
    }

    parseExp() {
        let downstream = this.parseComp();
        while (this.lookahead.value == '=') {
            this.lexer.nextToken();
            let app_define = new Apply(this.makeWord('define'))
            app_define.args.push(downstream);
            app_define.args.push(this.parseExp());
            return app_define;
        }
        return downstream;
    }

    parseComp() {
        let first = this.parseTerm();
        while (this.COM_OP.includes(this.lookahead.value)) {
            let app_op = new Apply(new Word(this.lookahead));
            this.lexer.nextToken();
            app_op.args.push(first);
            app_op.args.push(this.parseTerm());
            first = app_op;
        }
        return first;
    }

    parseTerm() {
        let first = this.parseSum();
        while (this.SUM_OP.includes(this.lookahead.value)) {
            let app_op = new Apply(new Word(this.lookahead));
            this.lexer.nextToken();
            app_op.args.push(first);
            app_op.args.push(this.parseSum());
            first = app_op;
        }
        return first;
    }

    parseSum() {
        let first = this.parseFact();
        while (this.FAC_OP.includes(this.lookahead.value)) {
            let app_op = new Apply(new Word(this.lookahead));
            this.lexer.nextToken();
            app_op.args.push(first);
            app_op.args.push(this.parseFact());
            first = app_op;
        }
        return first;
    }

    parseFact() {
        let fact;
        if (this.lookahead.value == '(') {
            fact = this.parseParenthesis();
        } else if (this.lookahead.value == '[') {
            fact = this.parseArray();
        } else if (this.lookahead.type == 'STRING' || this.lookahead.type == 'NUMBER') {
            fact = new Value(this.lookahead);
            this.lexer.nextToken();
        } else if (this.isWord(this.lookahead.type)) {
            fact = new Word(this.lookahead);
            this.lexer.nextToken();
        } else {
            this.expected(this.lookahead.value + ' ');
        }
        return this.parseApply(fact);
    }

    parseApply(tree) {
        if (!this.lookahead) {
            return tree;
        } else if (this.lookahead.value == '(') {
            let apply = new Apply(tree);
            apply.args.push(this.parseParenthesis());
            return this.parseApply(apply);
        } else if (this.lookahead.value == '[') {
            let app_element = new Apply(this.makeWord('element'));
            app_element.args.push(tree);
            while (this.lookahead.value == '[') {
                this.nextToken();
                app_element.args.push(this.parseExpression());
                this.expected(']');
                this.lexer.nextToken();
            }
            return this.parseApply(app_element);
        } else {
            return tree;
        }
    }

    makeWord(word) {
        let dummy = {};
        dummy.value = word;
        return new Word(dummy);
    }
}