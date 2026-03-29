const _supabase = supabase.createClient('https://eqgpkdbdsfbtyisfkfsx.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxZ3BrZGJkc2ZidHlpc2ZrZnN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMzg5NjAsImV4cCI6MjA4OTgxNDk2MH0.XOiRUOt_5wwX5AcoVQX_VWL9lkNJWjA4k5-p4eEBYbg');

// 1. Sincronização Absoluta
async function forceSyncCart() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return;

    const { data: items, error } = await _supabase.from('cart_items').select('*').eq('user_id', user.id);

    if (!error && items) {
        // Unifica tudo para o padrão 'name' que o site entende
        const unified = items.map(i => ({
            id: i.id,
            name: i.product_name || i.name || "Produit",
            price: parseFloat(i.price) || 0,
            quantity: parseInt(i.quantity) || 1
        }));

        localStorage.setItem('cart', JSON.stringify(unified));
        
        // Atualiza a bolinha vermelha na hora
        const count = unified.reduce((acc, item) => acc + item.quantity, 0);
        const badges = document.querySelectorAll(".cartCount, .cart-badge, #cartCount, #cart-count");
        badges.forEach(b => {
            b.innerText = count;
            b.style.display = count > 0 ? "inline" : "none";
        });
    }
}

// 2. Adicionar com confirmação real do Banco
async function addToCart(name, price, imageUrl = "") {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) {
        alert("Veuillez vous connecter !");
        window.location.href = "login.html";
        return;
    }

    // Tenta salvar no Supabase
    const { error } = await _supabase.from('cart_items').insert([{
        user_id: user.id,
        product_name: name,
        price: parseFloat(price),
        image_url: imageUrl,
        quantity: 1
    }]);

    if (error) {
        console.error("Erro no Supabase:", error.message);
        alert("Erreur de sauvegarde. Vérifiez votre connexion.");
    } else {
        // SÓ ATUALIZA A TELA SE O BANCO CONFIRMAR QUE SALVOU
        await forceSyncCart();
        alert(name + " ajouté !");
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await forceSyncCart();
    if (typeof updateNavbarAuth === "function") updateNavbarAuth();
    if (typeof loadFlowers === "function") loadFlowers();
    if (typeof load === "function") load();
});