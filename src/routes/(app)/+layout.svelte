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
</svelte:head>

<div class="h-dvh w-screen select-none" style="padding: 10%;">
    <h1>CC PAY ZOZS</h1>
    <div class="divider"></div>
    {@render children?.()}
</div>
