if ('serviceWorker' in navigator) {
    //Enregistrement et lancement du service Worker
    navigator.serviceWorker.register( 
        '/pluton/service-worker.js'/*?v=' + Date.now()*/, 
        { 
            scope: '/pluton/' 
        }
    ).then(function(serviceWorkerRegistration) {

        subscribeToPush();

    }).catch(function(error) {
        // registration failed
        console.log('Registration failed with ' + error);
    });

    /**
     * Enregistre les service worker au Push
     * 
     * @since 1.0.0
     */
    function subscribeToPush() {
        navigator.serviceWorker.ready
        .then(function(serviceWorkerRegistration) {
            //Retourne la subscription existant si existe
            return serviceWorkerRegistration.pushManager.getSubscription()
            .then(function(subscription) {
                if ( subscription ) {
                    console.log('Déjà inscrit au Push');
                    return subscription;
                }

                console.log('Pas encore inscrit au Push');
                // Demande d'inscription au Push Server
                return serviceWorkerRegistration.pushManager.subscribe({ 
                    userVisibleOnly: true 
                })
                .then(function(subscription) {
                    var key = subscription.getKey('p256dh');
                    var token = subscription.getKey('auth');
                    var user = {
                        endpoint: subscription.endpoint,
                        publicKey: key ? btoa(String.fromCharCode.apply(null, new Uint8Array(key))) : null,
                        authKey: token ? btoa(String.fromCharCode.apply(null, new Uint8Array(token))) : null
                    };

                    console.log('Données inscription');
                    console.log(user);

                    //sauvegarde de l'inscription dans sur le serveur (serveur du site)
                    fetch('http://labs.hightao-mg.com/onja/web-push/subscribe.php', {
                        method: 'post',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(user)
                    })
                    .then(function(response) {
                        return response.json();
                    }).catch(function (err) {
                        console.log('Could not register subscription into app server', err);
                    });

                    return subscription;
                });
            });
        }).then(function(subscription) {
            console.log(JSON.stringify(subscription));
        })
        .catch(function(subscriptionErr) {
            // Check for a permission prompt issue
            console.log('Subscription failed ', subscriptionErr);
        });
    }
}