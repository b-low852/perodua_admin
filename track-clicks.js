(function () {
    const FIREBASE_CONFIG = {
        apiKey: "AIzaSyAaeDEqg9Bqiew3LaMX5LWG8AWnoVbaO_c",
        authDomain: "perodua-2bab4.firebaseapp.com",
        projectId: "perodua-2bab4",
        storageBucket: "perodua-2bab4.firebasestorage.app",
        messagingSenderId: "491719396095",
        appId: "1:491719396095:web:fd8549baf741d896f85aca"
    };

    const FIREBASE_VERSION = "10.7.1";
    let db = null;

    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            if (document.querySelector('script[src="' + src + '"]')) {
                resolve();
                return;
            }

            const script = document.createElement("script");
            script.src = src;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async function initFirebase() {
        if (!window.firebase) {
            await loadScript("https://www.gstatic.com/firebasejs/" + FIREBASE_VERSION + "/firebase-app-compat.js");
            await loadScript("https://www.gstatic.com/firebasejs/" + FIREBASE_VERSION + "/firebase-firestore-compat.js");
        }

        if (!firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
        }

        db = firebase.firestore();
    }

    function detectLinkType(href) {
        if (!href) {
            return null;
        }

        const url = href.toLowerCase();

        if (url.includes("wa.me") || url.includes("whatsapp.com") || url.includes("api.whatsapp.com")) {
            return "whatsapp";
        }

        if (url.startsWith("tel:")) {
            return "phone";
        }

        if (url.startsWith("mailto:")) {
            return "email";
        }

        if (url.startsWith("http://") || url.startsWith("https://")) {
            return "website";
        }

        return null;
    }

    async function trackLinkClick(linkType) {
        if (!db) {
            return;
        }

        const safeLinkType = (linkType || "website")
            .toString()
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9_-]/g, "") || "website";

        try {
            await db.collection("admin").doc("analytics").set({
                linkClicks: firebase.firestore.FieldValue.increment(1),
                ["clicks." + safeLinkType]: firebase.firestore.FieldValue.increment(1),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error("Failed to track link click:", error);
        }
    }

    function handleDocumentClick(event) {
        const link = event.target.closest("a[href], button[data-href]");

        if (!link) {
            return;
        }

        const href = link.getAttribute("href") || link.getAttribute("data-href") || "";
        const linkType = link.getAttribute("data-track-link") || detectLinkType(href);

        if (!linkType) {
            return;
        }

        trackLinkClick(linkType);
    }

    async function start() {
        try {
            await initFirebase();
            document.addEventListener("click", handleDocumentClick, true);
            window.trackLinkClick = trackLinkClick;
        } catch (error) {
            console.error("Link click tracking failed to start:", error);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }
})();
