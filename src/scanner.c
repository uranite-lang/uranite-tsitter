#include "tree_sitter/parser.h"

#include <stdint.h>
#include <stdlib.h>
#include <string.h>

#define MAX_INDENT_DEPTH 256

enum TokenType {
    TOKEN_INDENT,
    TOKEN_DEDENT,
    TOKEN_NEWLINE
};

typedef struct {
    uint16_t indent_level_stack[MAX_INDENT_DEPTH];
    uint16_t stack_depth;
    uint16_t bracket_nesting_depth;
    uint16_t pending_dedent_count;
} ScannerState;

static void scanner_state_reset(ScannerState *scanner_state) {
    memset(scanner_state, 0, sizeof(ScannerState));
    scanner_state->indent_level_stack[0] = 0;
    scanner_state->stack_depth = 1;
    scanner_state->bracket_nesting_depth = 0;
    scanner_state->pending_dedent_count = 0;
}

void *tree_sitter_uranite_external_scanner_create() {
    ScannerState *scanner_state = (ScannerState *)calloc(1, sizeof(ScannerState));
    if (scanner_state == NULL) {
        return NULL;
    }
    scanner_state_reset(scanner_state);
    return scanner_state;
}

void tree_sitter_uranite_external_scanner_destroy(void *scanner_payload) {
    free(scanner_payload);
}

unsigned tree_sitter_uranite_external_scanner_serialize(
    void *scanner_payload,
    char *serialization_buffer
) {
    ScannerState *scanner_state = (ScannerState *)scanner_payload;
    if (scanner_state == NULL || serialization_buffer == NULL) {
        return 0;
    }

    unsigned serialized_byte_count = 0;
    uint16_t stack_depth = scanner_state->stack_depth;
    if (stack_depth < 1) {
        stack_depth = 1;
    }
    if (stack_depth > MAX_INDENT_DEPTH) {
        stack_depth = MAX_INDENT_DEPTH;
    }

    memcpy(
        serialization_buffer + serialized_byte_count,
        &stack_depth,
        sizeof(uint16_t)
    );
    serialized_byte_count += sizeof(uint16_t);

    memcpy(
        serialization_buffer + serialized_byte_count,
        scanner_state->indent_level_stack,
        stack_depth * sizeof(uint16_t)
    );
    serialized_byte_count += (unsigned)(stack_depth * sizeof(uint16_t));

    uint16_t bracket_nesting_depth = scanner_state->bracket_nesting_depth;
    memcpy(
        serialization_buffer + serialized_byte_count,
        &bracket_nesting_depth,
        sizeof(uint16_t)
    );
    serialized_byte_count += sizeof(uint16_t);

    uint16_t pending_dedent_count = scanner_state->pending_dedent_count;
    memcpy(
        serialization_buffer + serialized_byte_count,
        &pending_dedent_count,
        sizeof(uint16_t)
    );
    serialized_byte_count += sizeof(uint16_t);

    return serialized_byte_count;
}

void tree_sitter_uranite_external_scanner_deserialize(
    void *scanner_payload,
    const char *serialization_buffer,
    unsigned buffer_length
) {
    ScannerState *scanner_state = (ScannerState *)scanner_payload;
    if (scanner_state == NULL) {
        return;
    }

    scanner_state_reset(scanner_state);

    if (serialization_buffer == NULL || buffer_length < sizeof(uint16_t)) {
        return;
    }

    unsigned read_offset = 0;
    uint16_t stack_depth = 0;

    memcpy(
        &stack_depth,
        serialization_buffer + read_offset,
        sizeof(uint16_t)
    );
    read_offset += sizeof(uint16_t);

    if (stack_depth < 1) {
        stack_depth = 1;
    }
    if (stack_depth > MAX_INDENT_DEPTH) {
        stack_depth = MAX_INDENT_DEPTH;
    }

    unsigned stack_bytes = (unsigned)(stack_depth * sizeof(uint16_t));
    if (buffer_length < read_offset + stack_bytes) {
        return;
    }

    memcpy(
        scanner_state->indent_level_stack,
        serialization_buffer + read_offset,
        stack_bytes
    );
    read_offset += stack_bytes;
    scanner_state->stack_depth = stack_depth;
    scanner_state->indent_level_stack[0] = 0;

    if (buffer_length >= read_offset + sizeof(uint16_t)) {
        memcpy(
            &scanner_state->bracket_nesting_depth,
            serialization_buffer + read_offset,
            sizeof(uint16_t)
        );
        read_offset += sizeof(uint16_t);
    } else {
        scanner_state->bracket_nesting_depth = 0;
    }

    if (buffer_length >= read_offset + sizeof(uint16_t)) {
        memcpy(
            &scanner_state->pending_dedent_count,
            serialization_buffer + read_offset,
            sizeof(uint16_t)
        );
    } else {
        scanner_state->pending_dedent_count = 0;
    }

    if (scanner_state->pending_dedent_count >= MAX_INDENT_DEPTH) {
        scanner_state->pending_dedent_count = MAX_INDENT_DEPTH - 1;
    }
}

static uint16_t scanner_stack_top(const ScannerState *scanner_state) {
    if (scanner_state == NULL || scanner_state->stack_depth == 0) {
        return 0;
    }
    return scanner_state->indent_level_stack[scanner_state->stack_depth - 1];
}

static void scanner_stack_push(ScannerState *scanner_state, uint16_t indent_width) {
    if (scanner_state != NULL && scanner_state->stack_depth < MAX_INDENT_DEPTH) {
        scanner_state->indent_level_stack[scanner_state->stack_depth] = indent_width;
        scanner_state->stack_depth++;
    }
}

static void scanner_stack_pop(ScannerState *scanner_state) {
    if (scanner_state != NULL && scanner_state->stack_depth > 1) {
        scanner_state->stack_depth--;
    }
}

static bool scanner_emit_dedent_to_base(ScannerState *scanner_state, TSLexer *lexer_handle) {
    if (scanner_state->stack_depth <= 1) {
        return false;
    }

    scanner_state->stack_depth--;
    if (scanner_state->stack_depth > 1) {
        scanner_state->pending_dedent_count = scanner_state->stack_depth - 1;
        scanner_state->stack_depth = 1;
    } else {
        scanner_state->pending_dedent_count = 0;
    }
    lexer_handle->result_symbol = TOKEN_DEDENT;
    return true;
}

static void scanner_skip_line_comment(TSLexer *lexer_handle) {
    while (!lexer_handle->eof(lexer_handle) &&
           lexer_handle->lookahead != '\n' &&
           lexer_handle->lookahead != '\r') {
        lexer_handle->advance(lexer_handle, true);
    }
}

bool tree_sitter_uranite_external_scanner_scan(
    void *scanner_payload,
    TSLexer *lexer_handle,
    const bool *valid_symbols
) {
    ScannerState *scanner_state = (ScannerState *)scanner_payload;

    if (scanner_state == NULL || lexer_handle == NULL || valid_symbols == NULL) {
        return false;
    }

    if (valid_symbols[TOKEN_DEDENT] && scanner_state->pending_dedent_count > 0) {
        scanner_state->pending_dedent_count--;
        lexer_handle->result_symbol = TOKEN_DEDENT;
        return true;
    }

    if (valid_symbols[TOKEN_NEWLINE] || valid_symbols[TOKEN_INDENT] || valid_symbols[TOKEN_DEDENT]) {
        bool encountered_newline = false;

        while (lexer_handle->lookahead == ' ' ||
               lexer_handle->lookahead == '\t' ||
               lexer_handle->lookahead == '\r' ||
               lexer_handle->lookahead == '\n') {

            if (lexer_handle->lookahead == '\n') {
                encountered_newline = true;
                lexer_handle->advance(lexer_handle, true);

                while (lexer_handle->lookahead == '\r') {
                    lexer_handle->advance(lexer_handle, true);
                }
                continue;
            }

            if (lexer_handle->lookahead == '\r') {
                encountered_newline = true;
                lexer_handle->advance(lexer_handle, true);
                if (lexer_handle->lookahead == '\n') {
                    lexer_handle->advance(lexer_handle, true);
                }
                while (lexer_handle->lookahead == '\r') {
                    lexer_handle->advance(lexer_handle, true);
                }
                continue;
            }

            if (encountered_newline == false) {
                lexer_handle->advance(lexer_handle, true);
                continue;
            }

            break;
        }

        if (lexer_handle->eof(lexer_handle)) {
            if (valid_symbols[TOKEN_DEDENT] && scanner_state->stack_depth > 1) {
                return scanner_emit_dedent_to_base(scanner_state, lexer_handle);
            }
            if (valid_symbols[TOKEN_NEWLINE] && encountered_newline) {
                lexer_handle->result_symbol = TOKEN_NEWLINE;
                return true;
            }
            return false;
        }

        if (encountered_newline == false) {
            return false;
        }

        lexer_handle->mark_end(lexer_handle);

        uint16_t measured_indent_width = 0;

        for (;;) {
            measured_indent_width = 0;

            while (lexer_handle->lookahead == ' ' || lexer_handle->lookahead == '\t') {
                if (lexer_handle->lookahead == '\t') {
                    if (measured_indent_width <= UINT16_MAX - 4) {
                        measured_indent_width += 4;
                    } else {
                        measured_indent_width = UINT16_MAX;
                    }
                } else {
                    if (measured_indent_width < UINT16_MAX) {
                        measured_indent_width += 1;
                    }
                }
                lexer_handle->advance(lexer_handle, true);
            }

            if (lexer_handle->eof(lexer_handle)) {
                if (valid_symbols[TOKEN_DEDENT] && scanner_state->stack_depth > 1) {
                    return scanner_emit_dedent_to_base(scanner_state, lexer_handle);
                }
                if (valid_symbols[TOKEN_NEWLINE]) {
                    lexer_handle->result_symbol = TOKEN_NEWLINE;
                    return true;
                }
                return false;
            }

            if (lexer_handle->lookahead == '\n' || lexer_handle->lookahead == '\r') {
                if (lexer_handle->lookahead == '\n') {
                    lexer_handle->advance(lexer_handle, true);
                    if (lexer_handle->lookahead == '\r') {
                        lexer_handle->advance(lexer_handle, true);
                    }
                } else {
                    lexer_handle->advance(lexer_handle, true);
                    if (lexer_handle->lookahead == '\n') {
                        lexer_handle->advance(lexer_handle, true);
                    }
                }
                lexer_handle->mark_end(lexer_handle);
                continue;
            }

            if (lexer_handle->lookahead == '#') {
                scanner_skip_line_comment(lexer_handle);
                if (lexer_handle->eof(lexer_handle)) {
                    if (valid_symbols[TOKEN_DEDENT] && scanner_state->stack_depth > 1) {
                        return scanner_emit_dedent_to_base(scanner_state, lexer_handle);
                    }
                    if (valid_symbols[TOKEN_NEWLINE]) {
                        lexer_handle->result_symbol = TOKEN_NEWLINE;
                        return true;
                    }
                    return false;
                }
                if (lexer_handle->lookahead == '\n' || lexer_handle->lookahead == '\r') {
                    if (lexer_handle->lookahead == '\n') {
                        lexer_handle->advance(lexer_handle, true);
                        if (lexer_handle->lookahead == '\r') {
                            lexer_handle->advance(lexer_handle, true);
                        }
                    } else {
                        lexer_handle->advance(lexer_handle, true);
                        if (lexer_handle->lookahead == '\n') {
                            lexer_handle->advance(lexer_handle, true);
                        }
                    }
                    lexer_handle->mark_end(lexer_handle);
                    continue;
                }
                break;
            }

            break;
        }

        uint16_t previous_indent_width = scanner_stack_top(scanner_state);

        if (measured_indent_width > previous_indent_width) {
            if (valid_symbols[TOKEN_INDENT]) {
                scanner_stack_push(scanner_state, measured_indent_width);
                lexer_handle->result_symbol = TOKEN_INDENT;
                return true;
            }
        } else if (measured_indent_width < previous_indent_width) {
            if (valid_symbols[TOKEN_DEDENT]) {
                while (scanner_stack_top(scanner_state) > measured_indent_width &&
                       scanner_state->stack_depth > 1) {
                    scanner_stack_pop(scanner_state);
                    scanner_state->pending_dedent_count++;
                }
                if (scanner_state->pending_dedent_count > 0) {
                    scanner_state->pending_dedent_count--;
                    lexer_handle->result_symbol = TOKEN_DEDENT;
                    return true;
                }
            }
        }

        if (valid_symbols[TOKEN_NEWLINE]) {
            lexer_handle->result_symbol = TOKEN_NEWLINE;
            return true;
        }
    }

    return false;
}
