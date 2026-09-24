#ifndef AES256_H
#define AES256_H

#include <Arduino.h>

/**
 * AES-256 ECB Encryption
 * Note: Key must be 32 bytes. Block is 16 bytes.
 */
void aes256_encrypt(uint8_t* block, const uint8_t* key);

/**
 * AES-256 GCM Authenticated Encryption with Associated Data (AEAD)
 * @param plaintext Data to encrypt (up to 16 bytes)
 * @param len Length of plaintext in bytes
 * @param key 32-byte AES-256 key
 * @param iv 12-byte initialization vector (Nonce)
 * @param ciphertext_out Output buffer for ciphertext (at least len bytes)
 * @param tag_out Output buffer for 16-byte authentication tag
 */
void aes256_gcm_encrypt(const uint8_t* plaintext, size_t len, const uint8_t* key, const uint8_t* iv, uint8_t* ciphertext_out, uint8_t* tag_out);

#endif
