<script>
	import '../../app.css';
	import favicon from '$lib/assets/logo.webp';
	import { onMount } from 'svelte';
	
	let { children } = $props();
</script>

<svelte:head>
	<!-- <link rel="icon" href={favicon} /> -->
    <script src="https://kit.fontawesome.com/592394738c.js" crossorigin="anonymous"></script>
	<!-- <script>
        import { userState } from '$lib/user.svelte';
        
		if(userState.session_token == undefined && window.location.href !== window.location.origin+"/login") {
			window.location.replace(window.location.origin+"/login")
		}
	</script> -->
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@40,400,0,0&icon_names=wallet" />
</svelte:head>

<div class="h-dvh w-screen select-none">
    <!-- <h1>CC PAY ZOZS</h1>
    <div class="divider"></div> -->
    {@render children?.()}
</div>
