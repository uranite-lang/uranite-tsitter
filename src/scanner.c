#include "tree_sitter/parser.h"

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

void *tree_sitter_uranite_external_scanner_create() {
    ScannerState *scanner_state = (ScannerState *)calloc(1, sizeof(ScannerState));
    scanner_state->indent_level_stack[0] = 0;
    scanner_state->stack_depth = 1;
    scanner_state->bracket_nesting_depth = 0;
    scanner_state->pending_dedent_count = 0;
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
    unsigned serialized_byte_count = 0;

    memcpy(
        serialization_buffer + serialized_byte_count,
        &scanner_state->stack_depth,
        sizeof(uint16_t)
    );
    serialized_byte_count += sizeof(uint16_t);

    uint16_t levels_to_serialize = scanner_state->stack_depth;
    if (levels_to_serialize > MAX_INDENT_DEPTH) {
        levels_to_serialize = MAX_INDENT_DEPTH;
    }
    memcpy(
        serialization_buffer + serialized_byte_count,
        scanner_state->indent_level_stack,
        levels_to_serialize * sizeof(uint16_t)
    );
    serialized_byte_count += levels_to_serialize * sizeof(uint16_t);

    memcpy(
        serialization_buffer + serialized_byte_count,
        &scanner_state->bracket_nesting_depth,
        sizeof(uint16_t)
    );
    serialized_byte_count += sizeof(uint16_t);

    memcpy(
        serialization_buffer + serialized_byte_count,
        &scanner_state->pending_dedent_count,
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

    if (buffer_length == 0) {
        scanner_state->indent_level_stack[0] = 0;
        scanner_state->stack_depth = 1;
        scanner_state->bracket_nesting_depth = 0;
        scanner_state->pending_dedent_count = 0;
        return;
    }

    unsigned read_offset = 0;

    memcpy(
        &scanner_state->stack_depth,
        serialization_buffer + read_offset,
        sizeof(uint16_t)
    );
    read_offset += sizeof(uint16_t);

    if (scanner_state->stack_depth > MAX_INDENT_DEPTH) {
        scanner_state->stack_depth = MAX_INDENT_DEPTH;
    }

    memcpy(
        scanner_state->indent_level_stack,
        serialization_buffer + read_offset,
        scanner_state->stack_depth * sizeof(uint16_t)
    );
    read_offset += scanner_state->stack_depth * sizeof(uint16_t);

    if (read_offset + sizeof(uint16_t) <= buffer_length) {
        memcpy(
            &scanner_state->bracket_nesting_depth,
            serialization_buffer + read_offset,
            sizeof(uint16_t)
        );
        read_offset += sizeof(uint16_t);
    }

    if (read_offset + sizeof(uint16_t) <= buffer_length) {
        memcpy(
            &scanner_state->pending_dedent_count,
            serialization_buffer + read_offset,
            sizeof(uint16_t)
        );
    }
}

static uint16_t scanner_stack_top(ScannerState *scanner_state) {
    if (scanner_state->stack_depth == 0) {
        return 0;
    }
    return scanner_state->indent_level_stack[scanner_state->stack_depth - 1];
}

static void scanner_stack_push(ScannerState *scanner_state, uint16_t indent_width) {
    if (scanner_state->stack_depth < MAX_INDENT_DEPTH) {
        scanner_state->indent_level_stack[scanner_state->stack_depth] = indent_width;
        scanner_state->stack_depth++;
    }
}

static void scanner_stack_pop(ScannerState *scanner_state) {
    if (scanner_state->stack_depth > 1) {
        scanner_state->stack_depth--;
    }
}

bool tree_sitter_uranite_external_scanner_scan(
    void *scanner_payload,
    TSLexer *lexer_handle,
    const bool *valid_symbols
) {
    ScannerState *scanner_state = (ScannerState *)scanner_payload;

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

            if (encountered_newline == false) {
                lexer_handle->advance(lexer_handle, true);
                continue;
            }

            break;
        }

        if (encountered_newline == false) {
            return false;
        }

        if (lexer_handle->eof(lexer_handle)) {
            if (scanner_state->stack_depth > 1) {
                scanner_state->stack_depth--;
                if (scanner_state->stack_depth > 1) {
                    scanner_state->pending_dedent_count = scanner_state->stack_depth - 1;
                    scanner_state->stack_depth = 1;
                }
                lexer_handle->result_symbol = TOKEN_DEDENT;
                return true;
            }
            if (valid_symbols[TOKEN_NEWLINE]) {
                lexer_handle->result_symbol = TOKEN_NEWLINE;
                return true;
            }
            return false;
        }

        lexer_handle->mark_end(lexer_handle);

        uint16_t measured_indent_width = 0;

        for (;;) {
            measured_indent_width = 0;
            while (lexer_handle->lookahead == ' ' || lexer_handle->lookahead == '\t') {
                if (lexer_handle->lookahead == '\t') {
                    measured_indent_width += 4;
                } else {
                    measured_indent_width += 1;
                }
                lexer_handle->advance(lexer_handle, true);
            }

            if (lexer_handle->eof(lexer_handle)) {
                if (scanner_state->stack_depth > 1) {
                    scanner_state->stack_depth--;
                    if (scanner_state->stack_depth > 1) {
                        scanner_state->pending_dedent_count = scanner_state->stack_depth - 1;
                        scanner_state->stack_depth = 1;
                    }
                    lexer_handle->result_symbol = TOKEN_DEDENT;
                    return true;
                }
                if (valid_symbols[TOKEN_NEWLINE]) {
                    lexer_handle->result_symbol = TOKEN_NEWLINE;
                    return true;
                }
                return false;
            }

            if (lexer_handle->lookahead == '\n' || lexer_handle->lookahead == '\r') {
                while (lexer_handle->lookahead == '\n' || lexer_handle->lookahead == '\r') {
                    lexer_handle->advance(lexer_handle, true);
                }
                lexer_handle->mark_end(lexer_handle);
                continue;
            }

            if (lexer_handle->lookahead == '#') {
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

    if (lexer_handle->lookahead == '(' ||
        lexer_handle->lookahead == '[' ||
        lexer_handle->lookahead == '{') {
        scanner_state->bracket_nesting_depth++;
    } else if (lexer_handle->lookahead == ')' ||
               lexer_handle->lookahead == ']' ||
               lexer_handle->lookahead == '}') {
        if (scanner_state->bracket_nesting_depth > 0) {
            scanner_state->bracket_nesting_depth--;
        }
    }

    return false;
}
