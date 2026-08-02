; Keywords — control flow
[
  "else"
  "elif"
  "for"
  "if"
  "match"
  "return"
  "while"
  "yield"
  "switch"
  "case"
  "defer"
  "try"
  "except"
  "finally"
  "raise"
] @keyword.control.flow

(break_statement) @keyword.control.flow
(continue_statement) @keyword.control.flow
(pass_statement) @keyword.control.flow

; Keywords — declarations
[
  "class"
  "struct"
  "enum"
  "interface"
  "trait"
  "function"
  "property"
  "const"
  "type"
  "extern"
  "package"
  "import"
  "from"
  "export"
  "implements"
  "extends"
  "unit"
  "backed"
] @keyword

; Keywords — OOP modifiers
[
  "abstract"
  "final"
  "native"
  "override"
  "static"
  "virtual"
  "new"
  "delete"
  "Readonly"
  "mut"
] @keyword.modifier

; Keywords — access
(access_modifier) @keyword.modifier.access

; Keywords — memory/safety
[
  "addressof"
  "move"
  "unsafe"
] @keyword.memory

; Keywords — async
[
  "async"
  "await"
] @keyword.coroutine

; Keywords — logic (textual operators)
[
  "and"
  "or"
  "not"
] @keyword.operator

; Keywords — other
[
  "as"
  "in"
  "is"
  "instanceof"
  "subclassof"
  "lambda"
  "raises"
] @keyword

; Self reference
(self_parameter) @variable.builtin

; Values
(boolean_literal) @constant.builtin
(none_literal) @constant.builtin

; Type names in declarations
(class_declaration
  declared_name: (identifier) @type.definition)
(struct_declaration
  declared_name: (identifier) @type.definition)
(enum_declaration
  declared_name: (identifier) @type.definition)
(interface_declaration
  declared_name: (identifier) @type.definition)
(trait_declaration
  declared_name: (identifier) @type.definition)

; Type specifiers
(type_specifier
  (identifier) @type)
(generic_type_specifier
  generic_base_name: (identifier) @type)
(nullable_type
  "?" @operator)
(pointer_type
  "*" @operator)

; Generic type parameters
(generic_parameter
  type_parameter_name: (identifier) @type.parameter)

; Function declarations
(function_declaration
  declared_name: (identifier) @function)

; Function calls
(call_expression
  called_function: (expression
    (primary_expression
      (identifier) @function.call)))
(call_expression
  called_function: (expression
    (primary_expression
      (member_access_expression
        accessed_member: (identifier) @function.method.call))))

; Constructor calls
(new_expression
  constructed_type: (type_specifier
    (identifier) @type))
(new_expression
  constructed_type: (type_specifier
    (generic_type_specifier
      generic_base_name: (identifier) @type)))

; Enum variants
(enum_variant
  variant_name: (identifier) @constant)

; Parameters
(parameter_declaration
  declared_name: (identifier) @variable.parameter)

; Variables
(variable_declaration
  declared_name: (identifier) @variable)
(constant_declaration
  declared_name: (identifier) @constant)

; Keyword arguments
(keyword_argument
  argument_name: (identifier) @variable.parameter)

; Exception binding
(except_clause
  exception_binding: (identifier) @variable)

; Import items
(import_item
  entity_name: (identifier) @type)
(import_item
  import_alias: (identifier) @type)

; Dotted identifier in package/import paths
(package_declaration
  package_path: (dotted_identifier
    (identifier) @module))
(import_statement
  module_path: (dotted_identifier
    (identifier) @module))

; Member access
(member_access_expression
  accessed_member: (identifier) @property)

; Literals
(integer_literal) @number
(float_literal) @number.float
(string_literal) @string
(character_literal) @character

; Comments
(line_comment) @comment
(block_comment) @comment.block
(docstring_comment) @comment.documentation

; Operators
[
  "+"
  "-"
  "*"
  "/"
  "%"
  "**"
  "=="
  "!="
  "<"
  ">"
  "<="
  ">="
  "&"
  "|"
  "^"
  "~"
  "<<"
  ">>"
  "="
  "+="
  "-="
  "*="
  "/="
  "%="
  "&="
  "|="
  "^="
  "<<="
  ">>="
  "->"
  "=>"
  ".."
  "..."
] @operator

; Punctuation
[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket

[
  ":"
  ","
  "."
  ";"
] @punctuation.delimiter

; Inline assembly
(inline_assembly_statement
  "asm" @keyword
  "volatile" @keyword)
(inline_assembly_statement
  assembly_template: (string_literal) @string.special)
(assembly_output_clause
  "output" @keyword.directive)
(assembly_input_clause
  "input" @keyword.directive)
(assembly_clobber_clause
  "clobber" @keyword.directive)

; Identifiers (catch-all, lowest priority)
(identifier) @variable
