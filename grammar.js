module.exports = grammar({
  name: 'uranite',

  externals: externalSymbolTable => [
    externalSymbolTable._indent,
    externalSymbolTable._dedent,
    externalSymbolTable._newline,
  ],

  extras: extraTokenTable => [
    /[ \t\r]/,
    extraTokenTable._newline,
    extraTokenTable.line_comment,
    extraTokenTable.block_comment,
  ],

  word: wordRuleSymbol => wordRuleSymbol.identifier,

  conflicts: conflictTable => [
    [conflictTable.type_specifier, conflictTable.generic_type_specifier],
    [conflictTable.function_modifier, conflictTable.class_modifier],
    [conflictTable.generic_type_specifier, conflictTable.primary_expression],
    [conflictTable.qualified_pattern, conflictTable.primary_expression],
    [conflictTable.type_specifier, conflictTable.primary_expression],
  ],

  rules: {
    source_file: ruleFactory => seq(
      optional(ruleFactory.package_declaration),
      repeat(ruleFactory._statement),
    ),

    package_declaration: ruleFactory => seq(
      'package',
      field('package_path', ruleFactory.dotted_identifier),
    ),

    dotted_identifier: ruleFactory => seq(
      ruleFactory._path_segment,
      repeat(seq('.', ruleFactory._path_segment)),
    ),

    _path_segment: ruleFactory => prec.left(seq(
      ruleFactory.identifier,
      repeat(seq('-', choice(ruleFactory.identifier, ruleFactory.integer_literal))),
    )),

    _statement: ruleFactory => choice(
      ruleFactory.import_statement,
      ruleFactory.function_declaration,
      ruleFactory.class_declaration,
      ruleFactory.struct_declaration,
      ruleFactory.enum_declaration,
      ruleFactory.interface_declaration,
      ruleFactory.trait_declaration,
      ruleFactory.implement_declaration,
      ruleFactory.extern_declaration,
      ruleFactory.constant_declaration,
      ruleFactory.type_alias_declaration,
      ruleFactory.export_block,
      ruleFactory.variable_declaration,
      ruleFactory.assignment_statement,
      ruleFactory.expression_statement,
      ruleFactory.return_statement,
      ruleFactory.break_statement,
      ruleFactory.continue_statement,
      ruleFactory.raise_statement,
      ruleFactory.delete_statement,
      ruleFactory.defer_statement,
      ruleFactory.yield_statement,
      ruleFactory.pass_statement,
      ruleFactory.inline_assembly_statement,
      ruleFactory.if_statement,
      ruleFactory.while_statement,
      ruleFactory.for_range_statement,
      ruleFactory.for_cstyle_statement,
      ruleFactory.match_statement,
      ruleFactory.switch_statement,
      ruleFactory.try_statement,
      ruleFactory.unsafe_block,
    ),

    // ==========================================
    // Import
    // ==========================================

    import_statement: ruleFactory => choice(
      seq(
        optional(ruleFactory.access_modifier),
        'import',
        field('module_path', ruleFactory.dotted_identifier),
        optional(seq('as', field('import_alias', ruleFactory.identifier))),
      ),
      seq(
        optional(ruleFactory.access_modifier),
        'from',
        field('module_path', ruleFactory.dotted_identifier),
        'import',
        field('imported_entities', ruleFactory._import_target),
      ),
    ),

    _import_target: ruleFactory => choice(
      '*',
      ruleFactory.import_item_list,
      ruleFactory.import_item_brace_list,
    ),

    import_item_list: ruleFactory => seq(
      ruleFactory.import_item,
      repeat(seq(',', ruleFactory.import_item)),
    ),

    import_item_brace_list: ruleFactory => seq(
      '{',
      ruleFactory.import_item,
      repeat(seq(',', ruleFactory.import_item)),
      optional(','),
      '}',
    ),

    import_item: ruleFactory => seq(
      field('entity_name', ruleFactory.identifier),
      optional(seq('as', field('import_alias', ruleFactory.identifier))),
    ),

    // ==========================================
    // Declarations
    // ==========================================

    function_declaration: ruleFactory => seq(
      optional(ruleFactory.access_modifier),
      repeat(ruleFactory.function_modifier),
      choice('function', 'property'),
      field('declared_name', ruleFactory.identifier),
      optional(ruleFactory.generic_parameter_list),
      ruleFactory.parameter_list,
      optional(seq('->', field('return_type', ruleFactory.type_specifier))),
      optional(seq('raises', ruleFactory._raises_type_list)),
      choice(ruleFactory.indented_body, ':', ';'),
    ),

    _raises_type_list: ruleFactory => seq(
      ruleFactory.type_specifier,
      repeat(seq('|', ruleFactory.type_specifier)),
    ),

    function_modifier: ruleFactory => choice(
      'virtual',
      'override',
      'abstract',
      'static',
      'final',
      'async',
      'native',
    ),

    class_declaration: ruleFactory => seq(
      optional(ruleFactory.access_modifier),
      repeat(ruleFactory.class_modifier),
      'class',
      field('declared_name', ruleFactory.identifier),
      optional(ruleFactory.generic_parameter_list),
      optional(seq('extends', field('base_class_type', ruleFactory.type_specifier))),
      optional(seq('implements', ruleFactory._implements_type_list)),
      choice(ruleFactory.indented_body, ';'),
    ),

    _implements_type_list: ruleFactory => seq(
      field('implemented_interface', ruleFactory.type_specifier),
      repeat(seq(',', field('implemented_interface', ruleFactory.type_specifier))),
    ),

    class_modifier: ruleFactory => choice(
      'Readonly',
      'abstract',
      'final',
      'native',
    ),

    struct_declaration: ruleFactory => seq(
      optional(ruleFactory.access_modifier),
      'struct',
      field('declared_name', ruleFactory.identifier),
      optional(ruleFactory.generic_parameter_list),
      choice(ruleFactory.indented_body, ';'),
    ),

    enum_declaration: ruleFactory => seq(
      optional(ruleFactory.access_modifier),
      'enum',
      field('declared_name', ruleFactory.identifier),
      optional(seq('backed', field('backing_type', ruleFactory.type_specifier))),
      ruleFactory.indented_body,
    ),

    enum_variant: ruleFactory => prec.right(seq(
      'unit',
      field('variant_name', ruleFactory.identifier),
      optional(field('variant_backing_value', ruleFactory.expression)),
    )),

    interface_declaration: ruleFactory => seq(
      optional(ruleFactory.access_modifier),
      'interface',
      field('declared_name', ruleFactory.identifier),
      optional(ruleFactory.generic_parameter_list),
      optional(seq('extends', ruleFactory._implements_type_list)),
      choice(ruleFactory.indented_body, ';'),
    ),

    trait_declaration: ruleFactory => seq(
      optional(ruleFactory.access_modifier),
      'trait',
      field('declared_name', ruleFactory.identifier),
      optional(ruleFactory.generic_parameter_list),
      ruleFactory.indented_body,
    ),

    implement_declaration: ruleFactory => seq(
      'implements',
      optional(ruleFactory.generic_parameter_list),
      field('trait_type', ruleFactory.type_specifier),
      'for',
      field('target_type', ruleFactory.type_specifier),
      ruleFactory.indented_body,
    ),

    extern_declaration: ruleFactory => seq(
      'extern',
      'function',
      field('declared_name', ruleFactory.identifier),
      ruleFactory.parameter_list,
      optional(seq('->', field('return_type', ruleFactory.type_specifier))),
      ';',
    ),

    constant_declaration: ruleFactory => prec.right(seq(
      optional(ruleFactory.access_modifier),
      'const',
      field('constant_type', ruleFactory.type_specifier),
      field('declared_name', ruleFactory.identifier),
      '=',
      field('constant_value', ruleFactory.expression),
    )),

    type_alias_declaration: ruleFactory => seq(
      optional(ruleFactory.access_modifier),
      'type',
      field('declared_name', ruleFactory.identifier),
      optional(ruleFactory.generic_parameter_list),
      '=',
      field('aliased_type', ruleFactory.type_specifier),
    ),

    export_block: ruleFactory => seq(
      'export',
      '{',
      optional(seq(
        ruleFactory.identifier,
        repeat(seq(',', ruleFactory.identifier)),
        optional(','),
      )),
      '}',
    ),

    // ==========================================
    // Parameters & Arguments
    // ==========================================

    parameter_list: ruleFactory => seq(
      '(',
      optional(seq(
        ruleFactory.parameter_declaration,
        repeat(seq(',', ruleFactory.parameter_declaration)),
        optional(','),
      )),
      ')',
    ),

    parameter_declaration: ruleFactory => choice(
      ruleFactory.self_parameter,
      '...',
      seq(
        optional(ruleFactory.access_modifier),
        field('parameter_type', ruleFactory.type_specifier),
        field('declared_name', ruleFactory.identifier),
        optional(choice(
          ruleFactory.variadic_array_suffix,
          ruleFactory.kwargs_brace_suffix,
        )),
        optional(seq('=', field('default_value', ruleFactory.expression))),
      ),
    ),

    self_parameter: _ruleFactory => 'self',

    variadic_array_suffix: _ruleFactory => seq('[', ']'),

    kwargs_brace_suffix: _ruleFactory => seq('{', '}'),

    argument_list: ruleFactory => seq(
      '(',
      optional(seq(
        ruleFactory._argument,
        repeat(seq(',', ruleFactory._argument)),
        optional(','),
      )),
      ')',
    ),

    _argument: ruleFactory => choice(
      ruleFactory.keyword_argument,
      ruleFactory.expression,
    ),

    keyword_argument: ruleFactory => prec(1, seq(
      field('argument_name', ruleFactory.identifier),
      '=',
      field('argument_value', ruleFactory.expression),
    )),

    // ==========================================
    // Generics
    // ==========================================

    generic_parameter_list: ruleFactory => seq(
      '<',
      ruleFactory.generic_parameter,
      repeat(seq(',', ruleFactory.generic_parameter)),
      '>',
    ),

    generic_parameter: ruleFactory => seq(
      field('type_parameter_name', ruleFactory.identifier),
      optional(seq(':', ruleFactory._generic_constraint_list)),
    ),

    _generic_constraint_list: ruleFactory => prec.left(seq(
      ruleFactory.type_specifier,
      repeat(seq(',', ruleFactory.type_specifier)),
    )),

    generic_argument_list: ruleFactory => seq(
      '<',
      ruleFactory.type_specifier,
      repeat(seq(',', ruleFactory.type_specifier)),
      '>',
    ),

    // ==========================================
    // Types
    // ==========================================

    type_specifier: ruleFactory => choice(
      ruleFactory.nullable_type,
      ruleFactory.pointer_type,
      ruleFactory.generic_type_specifier,
      ruleFactory.callable_type,
      ruleFactory.meta_type,
      ruleFactory.identifier,
    ),

    pointer_type: ruleFactory => seq(
      '*',
      field('pointed_type', ruleFactory.type_specifier),
    ),

    nullable_type: ruleFactory => seq(
      '?',
      field('inner_type', ruleFactory.type_specifier),
    ),

    generic_type_specifier: ruleFactory => seq(
      field('generic_base_name', ruleFactory.identifier),
      ruleFactory.generic_argument_list,
    ),

    callable_type: ruleFactory => seq(
      'Callable',
      '<',
      field('callable_return_type', ruleFactory.type_specifier),
      ',',
      '<',
      optional(seq(
        ruleFactory.type_specifier,
        repeat(seq(',', ruleFactory.type_specifier)),
      )),
      '>',
      '>',
    ),

    meta_type: ruleFactory => seq(
      'Meta',
      '<',
      field('meta_inner_type', ruleFactory.type_specifier),
      '>',
    ),

    // ==========================================
    // Control Flow
    // ==========================================

    if_statement: ruleFactory => seq(
      'if',
      field('condition', ruleFactory.expression),
      ruleFactory.indented_body,
      repeat(ruleFactory.elif_clause),
      optional(ruleFactory.else_clause),
    ),

    elif_clause: ruleFactory => seq(
      'elif',
      field('condition', ruleFactory.expression),
      ruleFactory.indented_body,
    ),

    else_clause: ruleFactory => seq(
      'else',
      ruleFactory.indented_body,
    ),

    while_statement: ruleFactory => seq(
      'while',
      field('condition', ruleFactory.expression),
      ruleFactory.indented_body,
    ),

    for_range_statement: ruleFactory => seq(
      'for',
      optional(field('iterator_type', ruleFactory.type_specifier)),
      field('iterator_name', ruleFactory.identifier),
      'in',
      field('iterable', ruleFactory.expression),
      ruleFactory.indented_body,
    ),

    for_cstyle_statement: ruleFactory => seq(
      'for',
      field('initializer_type', ruleFactory.type_specifier),
      field('initializer_name', ruleFactory.identifier),
      '=',
      field('initializer_value', ruleFactory.expression),
      ';',
      field('loop_condition', ruleFactory.expression),
      ';',
      field('loop_update', ruleFactory._for_update_clause),
      ruleFactory.indented_body,
    ),

    _for_update_clause: ruleFactory => choice(
      ruleFactory.for_update_assignment,
      ruleFactory.for_update_increment,
      ruleFactory.expression,
    ),

    for_update_assignment: ruleFactory => prec.right(seq(
      field('update_target', ruleFactory.expression),
      field('update_operator', ruleFactory._assignment_operator),
      field('update_value', ruleFactory.expression),
    )),

    for_update_increment: ruleFactory => prec.right(seq(
      field('update_target', ruleFactory.expression),
      choice('++', '--'),
    )),

    match_statement: ruleFactory => seq(
      'match',
      field('matched_subject', ruleFactory.expression),
      ':',
      ruleFactory._indent,
      repeat1(ruleFactory.match_case),
      ruleFactory._dedent,
    ),

    match_case: ruleFactory => seq(
      field('case_pattern', ruleFactory._pattern),
      '=>',
      choice(
        ruleFactory.indented_body,
        ruleFactory.expression,
      ),
    ),

    switch_statement: ruleFactory => seq(
      'switch',
      field('switched_subject', ruleFactory.expression),
      ':',
      ruleFactory._indent,
      repeat1(ruleFactory.switch_case),
      ruleFactory._dedent,
    ),

    switch_case: ruleFactory => seq(
      'case',
      field('case_pattern', ruleFactory._pattern),
      ruleFactory.indented_body,
    ),

    _pattern: ruleFactory => choice(
      ruleFactory.qualified_pattern,
      ruleFactory.literal_pattern,
      ruleFactory.wildcard_pattern,
    ),

    qualified_pattern: ruleFactory => seq(
      ruleFactory.identifier,
      optional(seq('.', ruleFactory.identifier)),
    ),

    literal_pattern: ruleFactory => choice(
      ruleFactory.integer_literal,
      ruleFactory.float_literal,
      ruleFactory.string_literal,
      ruleFactory.character_literal,
      ruleFactory.boolean_literal,
      ruleFactory.none_literal,
    ),

    wildcard_pattern: _ruleFactory => '*',

    try_statement: ruleFactory => seq(
      'try',
      ruleFactory.indented_body,
      repeat1(ruleFactory.except_clause),
      optional(ruleFactory.finally_clause),
    ),

    except_clause: ruleFactory => seq(
      'except',
      optional(choice(
        seq(
          field('exception_type', ruleFactory.type_specifier),
          optional(seq('as', field('exception_binding', ruleFactory.identifier))),
        ),
        seq('as', field('exception_binding', ruleFactory.identifier)),
      )),
      ruleFactory.indented_body,
    ),

    finally_clause: ruleFactory => seq(
      'finally',
      ruleFactory.indented_body,
    ),

    unsafe_block: ruleFactory => seq(
      'unsafe',
      ruleFactory.indented_body,
    ),

    // ==========================================
    // Simple Statements
    // ==========================================

    variable_declaration: ruleFactory => prec.dynamic(10, prec.right(seq(
      optional(ruleFactory.access_modifier),
      optional('mut'),
      field('variable_type', ruleFactory.type_specifier),
      field('declared_name', ruleFactory.identifier),
      optional(seq('=', field('initial_value', ruleFactory.expression))),
    ))),

    assignment_statement: ruleFactory => prec.right(seq(
      field('assignment_target', ruleFactory.expression),
      field('assignment_operator', ruleFactory._assignment_operator),
      field('assigned_value', ruleFactory.expression),
    )),

    _assignment_operator: _ruleFactory => choice(
      '=', '+=', '-=', '*=', '/=', '%=',
      '&=', '|=', '^=', '<<=', '>>=',
    ),

    return_statement: ruleFactory => prec.right(seq(
      'return',
      optional(field('return_value', ruleFactory.expression)),
    )),

    break_statement: _ruleFactory => 'break',
    continue_statement: _ruleFactory => 'continue',
    pass_statement: _ruleFactory => 'pass',

    raise_statement: ruleFactory => prec.right(seq(
      'raise',
      field('raised_expression', ruleFactory.expression),
    )),

    delete_statement: ruleFactory => prec.right(seq(
      'delete',
      field('deleted_expression', ruleFactory.expression),
    )),

    defer_statement: ruleFactory => prec.right(seq(
      'defer',
      field('deferred_expression', ruleFactory.expression),
    )),

    yield_statement: ruleFactory => prec.right(seq(
      'yield',
      optional('from'),
      field('yielded_expression', ruleFactory.expression),
    )),

    expression_statement: ruleFactory => ruleFactory.expression,

    // ==========================================
    // Inline Assembly
    // ==========================================

    inline_assembly_statement: ruleFactory => seq(
      'asm',
      optional('volatile'),
      field('assembly_template', ruleFactory.string_literal),
      optional(seq(
        ':',
        optional(field('output_operand_list', ruleFactory.assembly_output_clause)),
        optional(seq(
          ':',
          optional(field('input_operand_list', ruleFactory.assembly_input_clause)),
          optional(seq(
            ':',
            optional(field('clobber_register_list', ruleFactory.assembly_clobber_clause)),
          )),
        )),
      )),
    ),

    assembly_output_clause: ruleFactory => seq(
      'output',
      '(',
      optional(seq(
        ruleFactory.assembly_operand,
        repeat(seq(',', ruleFactory.assembly_operand)),
      )),
      ')',
    ),

    assembly_input_clause: ruleFactory => seq(
      'input',
      '(',
      optional(seq(
        ruleFactory.assembly_operand,
        repeat(seq(',', ruleFactory.assembly_operand)),
      )),
      ')',
    ),

    assembly_clobber_clause: ruleFactory => seq(
      'clobber',
      '(',
      optional(seq(
        ruleFactory.string_literal,
        repeat(seq(',', ruleFactory.string_literal)),
      )),
      ')',
    ),

    assembly_operand: ruleFactory => seq(
      field('operand_constraint', ruleFactory.string_literal),
      field('operand_variable', ruleFactory.expression),
    ),

    // ==========================================
    // Expressions
    // ==========================================

    expression: ruleFactory => choice(
      ruleFactory.match_expression,
      ruleFactory.lambda_expression,
      ruleFactory.binary_expression,
      ruleFactory.unary_expression,
      ruleFactory.await_expression,
      ruleFactory.cast_expression,
      ruleFactory.primary_expression,
    ),

    match_expression: ruleFactory => prec.left(seq(
      'match',
      field('matched_subject', ruleFactory.expression),
      'in',
      choice(
        seq('{', ruleFactory._match_arm_list, '}'),
        seq('\\', ruleFactory.match_arm, repeat(seq(',', '\\', ruleFactory.match_arm))),
      ),
    )),

    _match_arm_list: ruleFactory => seq(
      ruleFactory.match_arm,
      repeat(seq(',', ruleFactory.match_arm)),
      optional(','),
    ),

    match_arm: ruleFactory => seq(
      field('arm_pattern', ruleFactory._pattern),
      '=>',
      field('arm_result', ruleFactory.expression),
    ),

    lambda_expression: ruleFactory => choice(
      seq(
        'lambda',
        optional('final'),
        optional(ruleFactory._lambda_parameter_list),
        ':',
        field('lambda_body', ruleFactory.expression),
      ),
      seq(
        'function',
        ruleFactory.parameter_list,
        optional(seq('->', field('return_type', ruleFactory.type_specifier))),
        ruleFactory.indented_body,
      ),
    ),

    _lambda_parameter_list: ruleFactory => seq(
      ruleFactory._lambda_parameter,
      repeat(seq(',', ruleFactory._lambda_parameter)),
    ),

    _lambda_parameter: ruleFactory => seq(
      field('parameter_type', ruleFactory.type_specifier),
      field('parameter_name', ruleFactory.identifier),
    ),

    binary_expression: ruleFactory => choice(
      prec.left(1, seq(field('left_operand', ruleFactory.expression), 'or', field('right_operand', ruleFactory.expression))),
      prec.left(2, seq(field('left_operand', ruleFactory.expression), 'and', field('right_operand', ruleFactory.expression))),
      prec.left(3, seq(field('left_operand', ruleFactory.expression), '|', field('right_operand', ruleFactory.expression))),
      prec.left(4, seq(field('left_operand', ruleFactory.expression), '^', field('right_operand', ruleFactory.expression))),
      prec.left(5, seq(field('left_operand', ruleFactory.expression), '&', field('right_operand', ruleFactory.expression))),
      prec.left(6, seq(field('left_operand', ruleFactory.expression), choice('==', '!='), field('right_operand', ruleFactory.expression))),
      prec.left(7, seq(field('left_operand', ruleFactory.expression), choice('<', '<=', '>', '>=', 'in', 'instanceof', 'is', 'subclassof'), field('right_operand', ruleFactory.expression))),
      prec.left(7, seq(field('left_operand', ruleFactory.expression), 'is', 'not', field('right_operand', ruleFactory.expression))),
      prec.left(7, seq(field('left_operand', ruleFactory.expression), 'not', 'in', field('right_operand', ruleFactory.expression))),
      prec.left(8, seq(field('left_operand', ruleFactory.expression), choice('<<', '>>'), field('right_operand', ruleFactory.expression))),
      prec.left(9, seq(field('left_operand', ruleFactory.expression), choice('+', '-'), field('right_operand', ruleFactory.expression))),
      prec.left(10, seq(field('left_operand', ruleFactory.expression), choice('*', '/', '%'), field('right_operand', ruleFactory.expression))),
      prec.right(11, seq(field('left_operand', ruleFactory.expression), '**', field('right_operand', ruleFactory.expression))),
      prec.left(7, seq(field('left_operand', ruleFactory.expression), choice('..', '...'), field('right_operand', ruleFactory.expression))),
    ),

    unary_expression: ruleFactory => choice(
      prec(13, seq('not', field('unary_operand', ruleFactory.expression))),
      prec(13, seq('~', field('unary_operand', ruleFactory.expression))),
      prec(13, seq('-', field('unary_operand', ruleFactory.expression))),
      prec(13, seq('+', field('unary_operand', ruleFactory.expression))),
      prec(13, seq('addressof', field('unary_operand', ruleFactory.expression))),
      prec(13, seq('move', field('unary_operand', ruleFactory.expression))),
    ),

    await_expression: ruleFactory => prec(14, seq(
      'await',
      field('awaited_expression', ruleFactory.expression),
    )),

    cast_expression: ruleFactory => prec.left(12, seq(
      field('cast_operand', ruleFactory.expression),
      'as',
      field('target_type', ruleFactory.type_specifier),
    )),

    primary_expression: ruleFactory => choice(
      ruleFactory.identifier,
      ruleFactory.integer_literal,
      ruleFactory.float_literal,
      ruleFactory.string_literal,
      ruleFactory.character_literal,
      ruleFactory.boolean_literal,
      ruleFactory.none_literal,
      ruleFactory.self_expression,
      ruleFactory.parent_expression,
      ruleFactory.new_expression,
      ruleFactory.parenthesized_expression,
      ruleFactory.list_literal,
      ruleFactory.dict_literal,
      ruleFactory.comprehension_expression,
      ruleFactory.member_access_expression,
      ruleFactory.call_expression,
      ruleFactory.subscript_expression,
      ruleFactory.postfix_expression,
    ),

    self_expression: _ruleFactory => 'self',
    parent_expression: _ruleFactory => 'parent',

    new_expression: ruleFactory => prec(15, seq(
      'new',
      field('constructed_type', ruleFactory.type_specifier),
      ruleFactory.argument_list,
    )),

    parenthesized_expression: ruleFactory => seq(
      '(',
      ruleFactory.expression,
      ')',
    ),

    list_literal: ruleFactory => seq(
      '[',
      optional(seq(
        ruleFactory.expression,
        repeat(seq(',', ruleFactory.expression)),
        optional(','),
      )),
      ']',
    ),

    dict_literal: ruleFactory => seq(
      '{',
      optional(seq(
        ruleFactory.dict_entry,
        repeat(seq(',', ruleFactory.dict_entry)),
        optional(','),
      )),
      '}',
    ),

    dict_entry: ruleFactory => seq(
      field('entry_key', ruleFactory.expression),
      ':',
      field('entry_value', ruleFactory.expression),
    ),

    comprehension_expression: ruleFactory => choice(
      seq(
        '[',
        field('comprehension_element', ruleFactory.expression),
        'for',
        field('iterator_name', ruleFactory.identifier),
        'in',
        field('iterable_source', ruleFactory.expression),
        optional(seq('if', field('filter_condition', ruleFactory.expression))),
        ']',
      ),
      seq(
        '{',
        field('comprehension_key', ruleFactory.expression),
        ':',
        field('comprehension_value', ruleFactory.expression),
        'for',
        field('iterator_name', ruleFactory.identifier),
        'in',
        field('iterable_source', ruleFactory.expression),
        optional(seq('if', field('filter_condition', ruleFactory.expression))),
        '}',
      ),
    ),

    member_access_expression: ruleFactory => prec.left(16, seq(
      field('accessed_object', ruleFactory.expression),
      '.',
      field('accessed_member', ruleFactory.identifier),
    )),

    call_expression: ruleFactory => prec.left(16, seq(
      field('called_function', ruleFactory.expression),
      ruleFactory.argument_list,
    )),

    subscript_expression: ruleFactory => prec.left(16, seq(
      field('subscripted_object', ruleFactory.expression),
      '[',
      field('subscript_index', ruleFactory.expression),
      ']',
    )),

    postfix_expression: ruleFactory => prec.left(16, seq(
      field('postfix_operand', ruleFactory.expression),
      choice('++', '--'),
    )),

    // ==========================================
    // Modifiers
    // ==========================================

    access_modifier: _ruleFactory => choice(
      'public',
      'private',
      'protect',
    ),

    // ==========================================
    // Block
    // ==========================================

    indented_body: ruleFactory => seq(
      ':',
      ruleFactory._indent,
      repeat1(choice(
        ruleFactory._statement,
        ruleFactory.docstring_comment,
        ruleFactory.enum_variant,
      )),
      ruleFactory._dedent,
    ),

    // ==========================================
    // Literals
    // ==========================================

    identifier: _ruleFactory => /[a-zA-Z_][a-zA-Z0-9_]*/,

    integer_literal: _ruleFactory => token(choice(
      /0[bB][01](_?[01])*/,
      /0[oO][0-7](_?[0-7])*/,
      /0[xX][0-9a-fA-F](_?[0-9a-fA-F])*/,
      /[0-9](_?[0-9])*/,
    )),

    float_literal: _ruleFactory => token(
      /[0-9](_?[0-9])*\.[0-9](_?[0-9])*/,
    ),

    string_literal: _ruleFactory => token(choice(
      seq('"', repeat(choice(/[^"\\]/, /\\./)), '"'),
    )),

    character_literal: _ruleFactory => token(
      seq("'", choice(/[^'\\]/, /\\./), "'"),
    ),

    boolean_literal: _ruleFactory => choice('True', 'False'),
    none_literal: _ruleFactory => 'None',

    // ==========================================
    // Comments
    // ==========================================

    line_comment: _ruleFactory => token(prec(-1, seq('#', /[^\n]*/))),

    block_comment: _ruleFactory => token(seq(
      '#{',
      /[^}]*(\}[^#][^}]*)*/,
      '}#',
    )),

    docstring_comment: _ruleFactory => token(seq(
      '"""',
      /[^"]*("([^"]|"[^"])*)?/,
      '"""',
    )),
  },
});
