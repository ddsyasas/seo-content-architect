/**
 * Brevo (formerly Sendinblue) API Client
 * Server-side only - do not import in client components
 */

const BREVO_API_URL = 'https://api.brevo.com/v3';

interface BrevoContact {
  email: string;
  attributes?: {
    FIRSTNAME?: string;
    LASTNAME?: string;
    NAME?: string;
    [key: string]: string | undefined;
  };
  listIds: number[];
  updateEnabled?: boolean;
}

interface BrevoResponse {
  success: boolean;
  error?: string;
  id?: number;
}

/**
 * Add a contact to Brevo list(s)
 * @param email - Contact email
 * @param name - Contact full name
 * @param listIds - Array of list IDs to add the contact to
 * @returns Success status and any error message
 */
export async function addContactToBrevo(
  email: string,
  name: string,
  listIds: number[]
): Promise<BrevoResponse> {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.error('[Brevo] API key not configured');
    return { success: false, error: 'Brevo API key not configured' };
  }

  // Split name into first and last name for Brevo attributes
  const nameParts = name.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const contact: BrevoContact = {
    email: email.toLowerCase(),
    attributes: {
      FIRSTNAME: firstName,
      LASTNAME: lastName,
      NAME: name.trim(),
    },
    listIds,
    updateEnabled: true, // Update if contact already exists
  };

  try {
    console.log(`[Brevo] Starting request for ${email} to lists ${listIds.join(', ')}`);
    const startTime = Date.now();

    const response = await fetch(`${BREVO_API_URL}/contacts`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(contact),
    });

    console.log(`[Brevo] Response received in ${Date.now() - startTime}ms, status: ${response.status}`);

    if (response.status === 201) {
      // Contact created successfully
      const data = await response.json();
      console.log(`[Brevo] Contact added: ${email} to lists ${listIds.join(', ')}`);
      return { success: true, id: data.id };
    }

    if (response.status === 204) {
      // Contact already exists and was updated
      console.log(`[Brevo] Contact updated: ${email} in lists ${listIds.join(', ')}`);
      return { success: true };
    }

    // Handle errors
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.message || `HTTP ${response.status}`;
    console.error(`[Brevo] Error adding contact: ${errorMessage}`);
    return { success: false, error: errorMessage };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Brevo] Network error: ${errorMessage}`, error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Add a user to the SyncSEO user list (for registered users)
 */
export async function addUserToBrevo(email: string, name: string): Promise<BrevoResponse> {
  const listId = parseInt(process.env.BREVO_USER_LIST_ID || '4', 10);
  return addContactToBrevo(email, name, [listId]);
}

/**
 * Add a subscriber to the SyncSEO newsletter list
 */
export async function addNewsletterSubscriber(email: string, name: string): Promise<BrevoResponse> {
  const listId = parseInt(process.env.BREVO_NEWSLETTER_LIST_ID || '5', 10);
  return addContactToBrevo(email, name, [listId]);
}
