// Exporta un manejador para el método POST
export async function POST(request) {
    const { token } = await request.json();

    // Establecer el token como una cookie HttpOnly
    const response = new Response(JSON.stringify({ message: 'Token establecido correctamente' }), {
        status: 200,
        headers: {
            'Set-Cookie': `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict`, // Configura la cookie
        }
    });

    return response;
}