import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { create, NMessageProvider, NDialogProvider, NModal } from 'naive-ui';
import './style.css';
import App from './App.vue';
import router from './router';

const naive = create({
  components: [NMessageProvider, NDialogProvider, NModal],
});

const app = createApp(App);

app.use(createPinia());
app.use(naive);
app.use(router);

app.mount('#app');
