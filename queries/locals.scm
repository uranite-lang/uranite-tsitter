; Scope boundaries
(function_declaration) @local.scope
(class_declaration) @local.scope
(struct_declaration) @local.scope
(for_range_statement) @local.scope
(for_cstyle_statement) @local.scope
(while_statement) @local.scope
(lambda_expression) @local.scope
(except_clause) @local.scope

; Definitions
(function_declaration
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
(variable_declaration
  declared_name: (identifier) @local.definition.variable)
(constant_declaration
  declared_name: (identifier) @local.definition.constant)
(parameter_declaration
  declared_name: (identifier) @local.definition.parameter)
(except_clause
  exception_binding: (identifier) @local.definition.variable)
(for_range_statement
  iterator_name: (identifier) @local.definition.variable)
(for_cstyle_statement
  initializer_name: (identifier) @local.definition.variable)

; References
(identifier) @local.reference
