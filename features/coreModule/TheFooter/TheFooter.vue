<template>
  <footer :class="style.footer">
    <!-- <iframe
      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2434.748551042831!2d16.897404576673406!3d52.393108472028175!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47045b2acc508c09%3A0xb0c62b3d6b81910!2sLodowa%209%2C%2060-227%20Pozna%C5%84!5e0!3m2!1sen!2spl!4v1698696954124!5m2!1sen!2spl"
      width="100%"
      height="450"
      style="border: 0"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      title="Jak dojechać"
    ></iframe> -->
    <address :class="style.address">
      <a href="mailto: a.m.gorzynska@gmail.com" :class="style.link"><img :src="emailIcon" :class="style.icon" /> a.m.gorzynska@gmail.com</a>
      <a href="tel: +48660100318" :class="style.link"><img :src="phoneIcon" :class="style.icon" /> 660 100 318</a>
    </address>
    <div :class="style.copyright">© 2024 Fizjoterapia Anna Ignaś</div>
  </footer>
</template>

<script setup lang="ts">
import phoneIcon from './phone.png';
import emailIcon from './mail.png';
</script>

<style module="style">
.footer {
  background-color: var(--color-tertiary-light);
  font-size: 20px;
  line-height: 40px;
  padding: 40px;
}

.address {
  display: flex;
  flex-direction: column;
  text-align: center;
}

.icon {
  height: 20px;
  margin-right: 10px;
}

.link {
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--font-primary-color);
  text-decoration: none;
  font-style: normal;
}

.link:hover {
  color: var(--color-secondary);
}

.copyright {
  text-align: center;
}
</style>
