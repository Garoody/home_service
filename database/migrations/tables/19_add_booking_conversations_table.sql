-- =====================================================================
-- TABLES: booking_conversations, conversation_participants, conversation_messages
-- Messagerie privee liee a une reservation.
-- =====================================================================

SET CLIENT_ENCODING TO 'UTF8';

-- relation entre la table users et une autre table du projet.
CREATE TABLE IF NOT EXISTS public.booking_conversations (
    id_conversation uuid PRIMARY KEY DEFAULT uuidv7(),
    booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id_booking) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES public.users(id_user) ON DELETE CASCADE,
    provider_id uuid NOT NULL REFERENCES public.users(id_user) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz
);

DROP TRIGGER IF EXISTS set_timestamp_booking_conversations ON public.booking_conversations;
CREATE TRIGGER set_timestamp_booking_conversations
BEFORE UPDATE ON public.booking_conversations
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_booking_conversations_client_id
    ON public.booking_conversations(client_id);

CREATE INDEX IF NOT EXISTS idx_booking_conversations_provider_id
    ON public.booking_conversations(provider_id);

COMMENT ON TABLE public.booking_conversations IS 'Conversation privee ouverte automatiquement des la reservation';
COMMENT ON COLUMN public.booking_conversations.booking_id IS 'Reservation a laquelle la conversation est rattachee';

CREATE TABLE IF NOT EXISTS public.conversation_participants (
    conversation_id uuid NOT NULL REFERENCES public.booking_conversations(id_conversation) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id_user) ON DELETE CASCADE,
    archived_at timestamptz,
    deleted_at timestamptz,
    blocked_at timestamptz,
    last_read_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz,
    PRIMARY KEY (conversation_id, user_id)
);

DROP TRIGGER IF EXISTS set_timestamp_conversation_participants ON public.conversation_participants;
CREATE TRIGGER set_timestamp_conversation_participants
BEFORE UPDATE ON public.conversation_participants
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id
    ON public.conversation_participants(user_id);

COMMENT ON TABLE public.conversation_participants IS 'Etat individuel d une conversation pour chaque participant';
COMMENT ON COLUMN public.conversation_participants.archived_at IS 'Date d archivage de la conversation pour ce participant';
COMMENT ON COLUMN public.conversation_participants.deleted_at IS 'Date de suppression de la conversation pour ce participant';
COMMENT ON COLUMN public.conversation_participants.blocked_at IS 'Date de blocage de la conversation pour ce participant';

CREATE TABLE IF NOT EXISTS public.conversation_messages (
    id_message uuid PRIMARY KEY DEFAULT uuidv7(),
    conversation_id uuid NOT NULL REFERENCES public.booking_conversations(id_conversation) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES public.users(id_user) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT NOW(),
    updated_at timestamptz,
    CONSTRAINT chk_conversation_messages_content CHECK (char_length(trim(content)) BETWEEN 1 AND 5000)
);

DROP TRIGGER IF EXISTS set_timestamp_conversation_messages ON public.conversation_messages;
CREATE TRIGGER set_timestamp_conversation_messages
BEFORE UPDATE ON public.conversation_messages
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id
    ON public.conversation_messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_sender_id
    ON public.conversation_messages(sender_id);

COMMENT ON TABLE public.conversation_messages IS 'Messages echanges dans une conversation de reservation';
COMMENT ON COLUMN public.conversation_messages.content IS 'Contenu textuel du message envoye par un participant';
