<script>
	import '../../app.css';
    import bg from '$lib/assets/bg.jpg';
	
	let { children } = $props();
</script>

<svelte:head>
    <!-- <link rel="icon" href={favicon} /> -->
	<!-- <meta http-equiv="Content-Security-Policy" content="style-src http://localhost:5173/ https://accounts.google.com/gsi/ 'nonce-xxx123'" /> -->
    <!-- <meta name="google-signin-client_id" content="353499692029-rinrhlrh96le29aenai9fr8fbfq2o7gp.apps.googleusercontent.com"> -->
	<!-- <script src="https://accounts.google.com/gsi/client" async></script> -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@40,400,0,0&icon_names=wallet" />
</svelte:head>

<div class="w-screen h-dvh absolute overflow-hidden bg-cover -z-20" style="background-image: url({bg});"></div>
<!-- <div class="w-screen h-screen absolute -z-10" style="background: linear-gradient(180deg,rgba(0, 0, 0, 0.275) 20%, rgba(255, 255, 255, 0) 50%);"></div> -->
<div class="w-screen h-dvh">
    {@render children?.()}
</div>
