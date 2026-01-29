import { z } from 'zod';

export const DeviceInfoSchema = z.object({
  device_id: z.string().min(3),
  device_name: z.string().min(1),
  device_type: z.enum(['ios', 'android', 'web', 'desktop']),
  push_token: z.string().optional()
});

export const RegisterSchema = z.object({
  phone: z.string().min(5),
  country_code: z.string().min(1),
  device_info: DeviceInfoSchema
});

export const VerifyOtpSchema = z.object({
  verification_id: z.string().uuid(),
  otp_code: z.string().length(6),
  public_key: z.string().min(32)
});

export const RefreshSchema = z.object({
  refresh_token: z.string().min(10)
});

export const LogoutSchema = z.object({
  refresh_token: z.string().min(10),
  access_token: z.string().min(10).optional()
});

export const UpdateUserSchema = z.object({
  display_name: z.string().min(1).optional(),
  username: z.string().min(3).optional(),
  bio: z.string().max(200).optional(),
  avatar_url: z.string().url().optional()
});

export const PrivacySchema = z.object({
  privacy: z.enum(['everyone', 'contacts', 'nobody']),
  read_receipts: z.boolean()
});

export const ContactSchema = z.object({
  contact_id: z.string().uuid(),
  name: z.string().min(1).optional()
});

export const ContactUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(['pending', 'accepted', 'blocked']).optional()
});

export const ConversationSchema = z.object({
  type: z.enum(['direct', 'group', 'broadcast']),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  avatar_url: z.string().url().optional(),
  participant_ids: z.array(z.string().uuid())
});

export const MessageSendSchema = z.object({
  client_message_id: z.string().min(8),
  conversation_id: z.string().uuid(),
  content: z.object({
    ciphertext: z.string().min(8),
    nonce: z.string().min(8),
    ephemeral_key: z.string().min(8)
  }),
  type: z.enum(['text', 'image', 'video', 'file']),
  reply_to: z.string().uuid().nullable().optional(),
  temp_id: z.string().optional()
});

export const MessageReadSchema = z.object({
  conversation_id: z.string().uuid(),
  message_ids: z.array(z.string().uuid()),
  read_at: z.string().datetime()
});

export const MessageReactionSchema = z.object({
  emoji: z.string().min(1)
});

export const UploadUrlSchema = z.object({
  content_type: z.string().min(3),
  size_bytes: z.number().int().positive()
});

export const PreKeyBundleSchema = z.object({
  identity_key: z.string().min(32),
  signed_prekey: z.object({
    key_id: z.number().int().nonnegative(),
    public_key: z.string().min(32),
    signature: z.string().min(32),
    created_at: z.string().datetime()
  }),
  one_time_prekeys: z.array(
    z.object({
      key_id: z.number().int().nonnegative(),
      public_key: z.string().min(32)
    })
  )
});

export const WsAuthSchema = z.object({
  token: z.string().min(10),
  device_id: z.string().min(3),
  platform: z.enum(['ios', 'android', 'web', 'desktop'])
});

export const WsTypingSchema = z.object({
  conversation_id: z.string().uuid()
});

export type RegisterRequest = z.infer<typeof RegisterSchema>;
export type VerifyOtpRequest = z.infer<typeof VerifyOtpSchema>;
export type MessageSendRequest = z.infer<typeof MessageSendSchema>;
