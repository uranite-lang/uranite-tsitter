((inline_assembly_statement
  assembly_template: (string_literal) @injection.content)
  (#offset! @injection.content 0 1 0 -1)
  (#set! injection.language "asm"))

((assembly_arch_variant
  assembly_template: (string_literal) @injection.content)
  (#offset! @injection.content 0 1 0 -1)
  (#set! injection.language "asm"))
