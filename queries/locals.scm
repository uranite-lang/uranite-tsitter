; Scope boundaries
(function_declaration) @local.scope
(class_declaration) @local.scope
(struct_declaration) @local.scope
(enum_declaration) @local.scope
(interface_declaration) @local.scope
(trait_declaration) @local.scope
(implement_declaration) @local.scope
(type_alias_declaration) @local.scope
(extern_declaration) @local.scope
(for_range_statement) @local.scope
(for_cstyle_statement) @local.scope
(while_statement) @local.scope
(if_statement) @local.scope
(try_statement) @local.scope
(except_clause) @local.scope
(lambda_expression) @local.scope
(comprehension_expression) @local.scope
(inline_assembly_statement) @local.scope

; Definitions
(function_declaration
  declared_name: (identifier) @local.definition.function)
(extern_declaration
  declared_name: (identifier) @local.definition.function)
(class_declaration
  declared_name: (identifier) @local.definition.type)
(struct_declaration
  declared_name: (identifier) @local.definition.type)
(enum_declaration
  declared_name: (identifier) @local.definition.type)
(interface_declaration
  declared_name: (identifier) @local.definition.type)
(trait_declaration
  declared_name: (identifier) @local.definition.type)
(type_alias_declaration
  declared_name: (identifier) @local.definition.type)
(variable_declaration
  declared_name: (identifier) @local.definition.variable)
(constant_declaration
  declared_name: (identifier) @local.definition.constant)
(parameter_declaration
  declared_name: (identifier) @local.definition.parameter)
(lambda_expression
  parameter_name: (identifier) @local.definition.parameter)
(self_parameter) @local.definition.parameter
(except_clause
  exception_binding: (identifier) @local.definition.variable)
(for_range_statement
  iterator_name: (identifier) @local.definition.variable)
(for_range_statement
  iterator_name2: (identifier) @local.definition.variable)
(for_cstyle_statement
  initializer_name: (identifier) @local.definition.variable)
(comprehension_expression
  iterator_name: (identifier) @local.definition.variable)

; References
(identifier) @local.reference
