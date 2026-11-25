[
  (indented_body)
  (import_item_brace_list)
  (export_block)
  (list_literal)
  (dict_literal)
  (set_literal)
  (argument_list)
  (parameter_list)
] @indent.begin

[
  "]"
  ")"
  "}"
] @indent.end

[
  (elif_clause)
  (else_clause)
  (except_clause)
  (finally_clause)
] @indent.branch
