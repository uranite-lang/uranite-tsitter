; Definitions
(function_declaration
  declared_name: (identifier) @name) @definition.function
(extern_declaration
  declared_name: (identifier) @name) @definition.function

(class_declaration
  declared_name: (identifier) @name) @definition.class
(struct_declaration
  declared_name: (identifier) @name) @definition.class
(enum_declaration
  declared_name: (identifier) @name) @definition.class
(interface_declaration
  declared_name: (identifier) @name) @definition.interface
(trait_declaration
  declared_name: (identifier) @name) @definition.interface
(type_alias_declaration
  declared_name: (identifier) @name) @definition.type

(variable_declaration
  declared_name: (identifier) @name) @definition.variable
(constant_declaration
  declared_name: (identifier) @name) @definition.constant

(enum_variant
  variant_name: (identifier) @name) @definition.constant

; References
(call_expression
  called_function: (expression
    (primary_expression
      (identifier) @name))) @reference.call
(call_expression
  called_function: (expression
    (primary_expression
      (member_access_expression
        accessed_member: (identifier) @name)))) @reference.call

(new_expression
  constructed_type: (type_specifier
    (identifier) @name)) @reference.class
(new_expression
  constructed_type: (type_specifier
    (generic_type_specifier
      generic_base_name: (identifier) @name))) @reference.class
